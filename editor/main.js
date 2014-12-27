
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

	editor = new SharedWorker('worker/worker.js')
	
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
	
	editor.addEventListener("connect", connect);
	editor.addEventListener("newMod", newMod);
	editor.addEventListener("onRequest", onRequest);
	
}

function connect(e) {
	mods = mods.concat(e.data.mods);
	
	if (typeof lastRequest != "undefined")
		editor.port.postMessage({
			id: 'request',
			which: lastRequest,
			major: 'terrain'
		});
}

function newMod(e) {
	
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
	if (length == 1)
		editor.port.postMessage({id: 'request', which: 0, major: 'terrain'});
	
}

var plane, lastRequest;
function onRequest(e) {
	
	DATA = e.data;
	
	lastRequest = e.data.which;
	
	//Ignore requests that are not terrain, geometry, or pre-placement
	//	related
	if (e.data.major != "terrain") return;
	
	//For actual terrain
	if (e.data.major == "terrain") {
		
		//Make sure we have our data (we just check width and height)
		if (typeof e.data.terrain.width != "undefined" &&
				typeof e.data.terrain.height != "undefined") {
			
			//For easier access
			var terrain = e.data.terrain;
			
			//The geometry...
			var geometry = new THREE.PlaneBufferGeometry(
					terrain.width*128, terrain.height*128,
					terrain.width, terrain.height);
			
			//Some flags so it is updateable
			geometry.dynamic = true;
			/*geometry.addAttribute('color', new THREE.BufferAttribute(
					new Uint8ClampedArray(terrain.width * terrain.height * 3),
					3));*/
			
			//Material
			var material = new THREE.MeshPhongMaterial({color: 'green'});
			
			/*var material = new THREE.ShaderMaterial({
				uniforms: {
				},
				attributes: {
				}
			});*/
			
			//material.vertexColors = THREE.FaceColors;
			
			//Build the mesh
			plane = new THREE.Mesh(geometry, material);
			
			//And add it
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
		
		//File
		case 'New': window.open('new', 'New Mod',
				'width=250,height=500,scrollbars=no,location=no'); break;
		
		//window
		case 'Terrain Editor': window.open('../editor'); break;
		case 'Code Editor': window.open('code'); break;
		
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

function onMouseMove(e) {
	//console.log(e);
	ui.mouse.x = (e.offsetX / graphic.container.clientWidth) * 2 - 1;
	ui.mouse.y = (e.offsetY / graphic.container.clientHeight) * 2 - 1;
	
	ui.raycaster.setFromCamera(ui.mouse, graphic.camera);
	
	var intersects = ui.raycaster.intersectObjects(graphic.scene.children);
	
	if (intersects.length) {
		OBJS = intersects;
		
		intersects[0].face.color = new THREE.Color(0xf2b640);
		intersects[0].object.geometry.__dirtyColors = true;
	}
	
	//console.log(ui.mouse);
}

function attachUIEvents() {
	
	//Make our objects
	if (typeof ui.keys == "undefined") ui.keys = [];
	if (typeof ui.mouse == "undefined") ui.mouse = new THREE.Vector2();
	if (typeof ui.raycaster == "undefined")
		ui.raycaster = new THREE.Raycaster();
	
	//Attach them
	$(window).keydown(onKeyDown);
	$(window).keyup(onKeyUp);
	$(window).bind('mousewheel', onScroll);
	
	$("#world").mousemove(onMouseMove);
	
	//Build any keys we might want
	
	//Default linear methods (we scroll the camera until key up)
	ui.panLRKey = new Key({obj: graphic.camera.position, property: 'x'});
	ui.panUDKey = new Key({obj: graphic.camera.position, property: 'y'});
	
	//Approaches, handle detaching themselves
	ui.angleKey = new Key({
		obj: graphic.camera.rotation,
		property: 'x',
		method: 'approach',
		minRate: .01,
		target: 0
	});
	ui.ZoomKey = new Key({
		obj: graphic.camera.position,
		property: 'z',
		method: 'approach',
		minRate: 1,
		target: 1792
	});
}

/***********************************
**	Builder
************************************/

function buildUI() {
	
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
						'Code Editor',
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
				{
					view: 'accordion', type: 'line',
					width: 256, minWidth: 64,
					rows: [
						{header: 'Terrain', body: 'Content a'},
						{header: 'Widgets', body: 'Content b',
							collapsed: true},
						{header: 'Geometry', body: 'Content c',
							collapsed: true}
					]
				}
			]},
			{template: 'row 3', height: 30}
		]
	}).show();
	
}

/***********************************
**	Basic UI Construction
************************************/

function buildGraphics() {
	graphic = new Graphic("worldContainer", "world");
	
	graphic.loadBaseScene();
}

/***********************************
**	Loader
************************************/

$(document).ready(function() {
	
	buildEditor();
	buildUI();
	buildGraphics();
	
	setTimeout(function() {
		attachEditorListeners();
		attachUIEvents();
	}, 50);
	
	//This page was opened from another, grab the lastRequest
	//	Note this is the ONLY proper place to look at the previous window
	//	contextual as ALL mod-related data is stored on the worker, NOT the
	//	first window (as the first window can be closed)
	if (window.opener && typeof window.opener.lastRequest != "undefined") {
		
		//editor probably not, so we set lastRequest and check on connect
		lastRequest = window.opener.lastRequest;
	}
	
});
