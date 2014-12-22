
/***********************************
**	Primary Init
************************************/

var editor,
	ui,
	graphic,
	mods = [];

/***********************************
**	Editor
************************************/

function buildEditor() {

	editor = new SharedWorker('editor.js')
	
	editor.port.addEventListener('message', function(e) {
		
		console.log('r', e.data);
		
		var newEvent = new e.constructor(e.data.id, e);
		
		if (typeof e.data.id != "undefined")
			editor.dispatchEvent(newEvent);
		
	}, false);
	
	editor.port.start();
	
	editor.postMessage = editor.port.postMessage;
	
}

function attachEditorListeners() {
	
	editor.addEventListener("newMod", newMod);
	editor.addEventListener("onRequest", onRequest);
	
}

function newMod(e) {
	//$$('mod').add({e.data.path});
	//$$('mod').add(e.data.path);
	
	if (typeof modSubMenu == "undefined") {
		$$('mainMenu').enableItem('mod');
		
		var submenu = $$('mainMenu').getItem('mod').submenu;
		
		if (typeof submenu == "object")
			submenu.push(e.data.path);
		else {
			modSubMenu = $$(submenu)
			$$(submenu).add({value: e.data.path});
		}
	} else modSubMenu.add({value: e.data.path});
	
	var length = mods.push(e.data.path);
	
	//First mod
	if (length == 1) {
		editor.port.postMessage({id: 'request', which: 0, major: 'terrain'});
	}
}

var plane;

function onRequest(e) {
	
	//Ignore requests that are not terrain, geometry, or pre-placement related
	if (e.data.major != "terrain") return;
	
	if (e.data.major == "terrain") {
		if (typeof e.data.terrain.width != "undefined" && typeof e.data.terrain.height != "undefined") {
			var geometry = new THREE.PlaneBufferGeometry(e.data.terrain.width, e.data.terrain.height, e.data.terrain.width, e.data.terrain.height);
			var material = new THREE.MeshBasicMaterial({wireframe: true});
			
			plane = new THREE.Mesh(geometry, material);
			
			graphic.scene.add(plane);
		}
	}
}

/***********************************
************************************
**	UI
************************************
************************************/

/***********************************
**	Interactivity
************************************/

function menuSwitch(id) {
	var which = $$('mainMenu').getMenuItem(id).value;
	
	switch (which) {
		case 'New': window.open('new', 'New Mod',
				'width=250,height=500,scrollbars=no,location=no'); break;
		default: console.log('woot');
	}
}

/***********************************
**	Builder
************************************/

function buildUI() {
	
	RAWRmod = [];
	
	ui = webix.ui({
		container: 'body',
		rows: [
			{
				view: 'menu',
				id: "mainMenu",
				on: {onMenuItemclick: menuSwitch},
				data: [
					{value: 'File', submenu: [
						'New',
						{$template: 'Separator'},
						'Open remote',
						'Save remote',
						{$template: 'Separator'},
						'Open local',
						'Save local'
					]},
					{value: 'Edit'},
					{value: 'View', submenu: [
						'Subtiles'
					]},
					{value: 'Window', submenu: [
						'Properties',
						{$template: 'Separator'},
						'Terrain Editor',
						'Object Editor',
						'Trigger Editor',
					]},
					{value: 'Mod', id: 'mod', submenu: []},
					{value: 'Help'},
				]
			},
			{cols: [
				{width: 256, minWidth: 64, rows: [
					{
						template: '<canvas id="preview"></canvas>',
						type: 'clean', height: 256
					},
					{template: 'Properties'}
				]},
				{view: 'resizer'},
				{
					id: 'worldContainer',
					type: 'clean'
				},
				{view: 'resizer'},
				{view: 'accordion', type: 'line', width: 256, minWidth: 64, rows: [
					{header: 'Terrain', body: 'Content a'},
					{header: 'Widgets', body: 'Content b', collapsed: true},
					{header: 'Geometry', body: 'Content c', collapsed: true}
				]}
			]},
			{template: 'row 3', height: 30}
		]
	}).show();
	
	rawrMENU = $$('mainMenu').getItem('mod').submenu;
	
	$$('mainMenu').disableItem('mod');
	
}

/***********************************
**	Basic UI Construction
************************************/

function buildGraphics() {
	graphic = new Graphic("world");
	
	graphic.loadBaseScene();
}

/***********************************
**	Loader
************************************/

$(document).ready(function() {
	
	buildEditor();
	buildUI();
	buildGraphics();
	
	attachEditorListeners();
	
});
