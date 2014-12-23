
function removeA(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}

/***********************************
**	Primary Init
************************************/

var editor,
	ui = {},
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
	
	DATA = e.data;
	
	//Ignore requests that are not terrain, geometry, or pre-placement related
	if (e.data.major != "terrain") return;
	
	if (e.data.major == "terrain") {
		if (typeof e.data.terrain.width != "undefined" && typeof e.data.terrain.height != "undefined") {
			var geometry = new THREE.PlaneBufferGeometry(e.data.terrain.width*128, e.data.terrain.height*128,
															e.data.terrain.width, e.data.terrain.height);
			
			var material = new THREE.MeshPhongMaterial({color: 'green'});
			
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

function onKeyDown(e) {
	
	//No repeats
	if (ui.keys[e.which]) return;
	else ui.keys[e.which] = true;
	
	//Left or right
	if (e.which == 37 || e.which == 39) {
		if (e.which == 37) ui.panLRKey.amount = -4096;
		else ui.panLRKey.amount = 4096;
		
		ui.panLRKey.start = Date.now();
		ui.panLRKey.last = ui.panLRKey.start;
		
		graphic.keys.push(ui.panLRKey);
		
	//Up or down
	} else if (e.which == 38 || e.which == 40) {
		if (e.which == 38) ui.panUDKey.amount = 4096;
		else ui.panUDKey.amount = -4096;
		
		ui.panUDKey.start = Date.now();
		ui.panUDKey.last = ui.panUDKey.start;
		
		graphic.keys.push(ui.panUDKey);
	}
	
}

function onKeyUp(e) {
	
	//No repeats
	ui.keys[e.which] = false;
	
	//Left or right
	if (e.which == 37 || e.which == 39) {
		
		ui.panLRKey.update();
		removeA(graphic.keys, ui.panLRKey);
	
	//Up or down
	} else if (e.which == 38 || e.which == 40) {
		
		ui.panUDKey.update();
		removeA(graphic.keys, ui.panUDKey);
	}
	
	//Block alt from bubbling to browser UI
	if (e.which == 18) e.preventDefault();
	
}

function onScroll(e) {
	
	//Scroll = zoom
	if (!e.altKey) {
		
		if (e.originalEvent.wheelDelta > 0)
			ui.ZoomKey.target -= 32;
		else
			ui.ZoomKey.target += 32;
		
		if (graphic.keys.indexOf(ui.ZoomKey) < 0)
			graphic.keys.push(ui.ZoomKey);
		
	
	//ALT+Scroll = rotate along x (angle to ground)
	} else {
		
		if (e.originalEvent.wheelDelta > 0)
			ui.angleKey.target += 0.05;
		else
			ui.angleKey.target -= 0.05;
		
		if (graphic.keys.indexOf(ui.angleKey) < 0)
			graphic.keys.push(ui.angleKey);
	
	}
}

function attachUIEvents() {
	
	//Make our objects
	if (typeof ui.keys == "undefined") ui.keys = [];
	
	//Attach them
	$(window).keydown(onKeyDown);
	$(window).keyup(onKeyUp);
	$(window).bind('mousewheel', onScroll);
	
	//Build any keys we might want
	
	//Default linear methods (we scroll the camera until key up)
	ui.panLRKey = new Key({obj: graphic.camera.position, property: 'x'});
	ui.panUDKey = new Key({obj: graphic.camera.position, property: 'y'});
	
	//Approaches, handle detaching themselves
	ui.angleKey = new Key({obj: graphic.camera.rotation, property: 'x', method: 'approach', minRate: .01, target: 0});
	ui.ZoomKey = new Key({obj: graphic.camera.position, property: 'z', method: 'approach', minRate: 1, target: 1792});
}

/***********************************
**	Builder
************************************/

function buildUI() {
	
	RAWRmod = [];
	
	webix.ui({
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
	attachUIEvents();
	
});
