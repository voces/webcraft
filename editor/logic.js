
var mods = window.opener ?
		window.opener.mods || new Emitter([]) :
		new Emitter([]);

var logic = {
	
	graphic: null,
	
	//Objects we need
	keys: [],
	mouse: new THREE.Vector2(),
	mouseRaw: new THREE.Vector2(),
	raycaster: new THREE.Raycaster(),
	plane: null,
	
	//Save/loading
	localFileInput: document.createElement('input'),
	fileReader: new FileReader(),
	
	currentMod: null,
	
	//UI
	menu: null,
	modCaret: null,
	modList: null,
	openMethod: null,
	saveMethod: null,
	
	/****************************************************************************
	 *	Build any keys we might want
	 ****************************************************************************/
	
	currentCamera: 'world',
	
	//Default linear methods (we scroll the camera until key up)
	panLRKey: new Key({property: 'x'}),
	panUDKey: new Key({property: 'y'}),
	
	//Approaches, handle detaching themselves
	angleKey: new Key({
		property: 'x',
		method: 'approach',
		minRate: .01,
		target: 0
	}),
	zoomKey: new Key({
		property: 'z',
		method: 'approach',
		minRate: 1,
		target: 1792
	}),
	
	/****************************************************************************
	 ****************************************************************************
	 *	Init
	 ****************************************************************************
	 ****************************************************************************/
	
	init: function() {
		
		/**************************************************************************
		 **	UI stuff
		 **************************************************************************/
		
		this.modCaret = document.getElementById('mod').children[0].children[0];
		this.modList = document.getElementById('mod').children[1];
		
		this.openMethod = document.getElementById('menu').children[0].children[0]
				.children[1].children[2].children[0].firstChild;
		this.saveMethod = document.getElementById('menu').children[0].children[0]
				.children[1].children[3].children[0].firstChild;
		
		/**************************************************************************
		 **	Build our graphics and attach graphic-related values
		 **************************************************************************/
		
		//The object
		this.graphic = new Graphic(document.getElementById('world'));
		
		//Related keys
		this.panLRKey.obj = this.graphic.camera.position;
		this.panUDKey.obj = this.graphic.camera.position;
		this.angleKey.obj = this.graphic.camera.rotation;
		this.zoomKey.obj = this.graphic.camera.position;
		
		/**************************************************************************
		 **	Flesh out our file readers
		 **************************************************************************/
		
		this.localFileInput.setAttribute('type', 'file');
		this.localFileInput.addEventListener('change',
				this.handleLocalInput.bind(this), false);
		
		this.fileReader.onload = this.loadLocalFile.bind(this);
		
		/**************************************************************************
		 **	Events
		 **************************************************************************/
		
		//Keys
		$(window).keydown(this.onKeyDown.bind(this));
		$(window).keyup(this.onKeyUp.bind(this));
		
		//Mouse
		$(window).bind('mousewheel', this.onScroll.bind(this));
		$(window).mousemove(this.onMouseMove.bind(this));
		
		$('#menu').click(this.menuSwitch.bind(this));
		
		//Mods (other windows)
		mods.on("push", this.newMod.bind(this));
		
	}
};

/******************************************************************************
 ******************************************************************************
 **	Mods
 ******************************************************************************
 ******************************************************************************/

logic.loadTerrain = function(terrain) {
  
  var geometry = new THREE.PlaneBufferGeometry(
      terrain.width*128, terrain.height*128,
      terrain.width, terrain.height);
  
  var material = new THREE.MeshPhongMaterial({color: 'green'});
  
  this.plane = new THREE.Mesh(geometry, material);
  
  this.graphic.scene.add(this.plane);
  
};

logic.newMod = function(e) {
  
	//First mod, so add the caret
	this.modCaret.style.display = 'inline-block'
	
	//Now let's create our new menu item & append it
	
	var listItem = document.createElement('li');
	
	var link = document.createElement('a');
	link.innerText = e.detail.mod.meta.title;
	
	listItem.appendChild(link);
	this.modList.appendChild(listItem);
	
	//Okay, let's load the terrain if required
  if (this.plane == null) {
		this.currentMod = e.detail.id;
    this.loadTerrain(e.detail.mod.terrain);
	}
};

/******************************************************************************
 ******************************************************************************
 **	Graphics/Camera
 ******************************************************************************
 ******************************************************************************/

logic.onKeyDown = function(e) {
	
	//No repeats
	if (this.keys[e.which]) return;
	else this.keys[e.which] = true;
	
	//Left or right
	if (e.which == 37 || e.which == 39) {
		if (e.which == 37) this.panLRKey.amount = -4096;
		else this.panLRKey.amount = 4096;
		
		this.panLRKey.start = Date.now();
		this.panLRKey.last = this.panLRKey.start;
		
		this.graphic.keys.push(this.panLRKey);
		
	//Up or down
	} else if (e.which == 38 || e.which == 40) {
		if (e.which == 38) this.panUDKey.amount = 4096;
		else this.panUDKey.amount = -4096;
		
		this.panUDKey.start = Date.now();
		this.panUDKey.last = this.panUDKey.start;
		
		this.graphic.keys.push(this.panUDKey);
	}
	
}

logic.onKeyUp = function(e) {
	
	//No repeats
	this.keys[e.which] = false;
	
	//Left or right
	if (e.which == 37 || e.which == 39) {
		
		this.panLRKey.update();
		removeA(this.graphic.keys, this.panLRKey);
	
	//Up or down
	} else if (e.which == 38 || e.which == 40) {
		
		this.panUDKey.update();
		removeA(this.graphic.keys, this.panUDKey);
	}
	
	//Block alt from bubbling to browser UI
	if (e.which == 18) e.preventDefault();
	
}

logic.onScroll = function(e) {
	
	//Scroll = zoom
	if (!e.altKey) {
		
		if (e.originalEvent.wheelDelta > 0)
			this.zoomKey.target -= 32;
		else
			this.zoomKey.target += 32;
		
		if (this.graphic.keys.indexOf(this.zoomKey) < 0)
			this.graphic.keys.push(this.zoomKey);
		
	
	//ALT+Scroll = rotate along x (angle to ground)
	} else {
		
		if (e.originalEvent.wheelDelta > 0)
			this.angleKey.target += 0.05;
		else
			this.angleKey.target -= 0.05;
		
		if (this.graphic.keys.indexOf(this.angleKey) < 0)
			this.graphic.keys.push(this.angleKey);
	
	}
}

logic.onMouseMove = function(e) {
	
	this.mouseRaw.x = e.pageX;
	this.mouseRaw.y = e.pageY;
	
	if (this.mouseRaw.y > 33 && this.mouseRaw.y < 290 && this.mouseRaw.x < 257) {
		if (this.currentCamera == 'world') {
			this.currentCamera = 'preview';
			
			this.panLRKey.obj = this.graphic.previewCamera.position;
			this.panUDKey.obj = this.graphic.previewCamera.position;
			this.angleKey.obj = this.graphic.previewCamera.rotation;
			this.zoomKey.obj = this.graphic.previewCamera.position;
		}
	} else if (this.currentCamera == 'preview') {
		this.currentCamera = 'world';
		
		this.panLRKey.obj = this.graphic.camera.position;
		this.panUDKey.obj = this.graphic.camera.position;
		this.angleKey.obj = this.graphic.camera.rotation;
		this.zoomKey.obj = this.graphic.camera.position;
	}
	
	this.mouse.x = (e.offsetX / this.graphic.canvas.clientWidth) * 2 - 1;
	this.mouse.y = (e.offsetY / this.graphic.canvas.clientHeight) * 2 - 1;
	
	this.raycaster.setFromCamera(this.mouse, this.graphic.camera);
	
	var intersects = this.raycaster.intersectObjects(this.graphic.scene.children);
	
	if (intersects.length) {
		OBJS = intersects;
		
		/*intersects[0].face.color = new THREE.Color(0xf2b640);
		intersects[0].object.geometry.__dirtyColors = true;*/
	}
	
	//console.log(ui.mouse);
}

/******************************************************************************
 ******************************************************************************
 **	UI
 ******************************************************************************
 ******************************************************************************/

logic.loadLocalFile = function(e, blah, blah2) {
	var file = this.fileReader.result;
	
	var mod = Mod.load(file);
	var id = mods.push(mod) - 1;
	
	mods.emit('push', new CustomEvent('push', {
		detail: {mod: mod, id: id}
	}));
};

logic.handleLocalInput = function(e) {
	var file = e.target.files[0];
	this.fileReader.readAsText(file);
};

logic.openLocal = function() {
	this.localFileInput.click();
};

logic.saveLocal = function() {
	
	if (this.currentMod == null) {
		message({
			error: true,
			text: 'You must select a mod to add a selection to.'
		});
		
		return;
	}
	
	mods[this.currentMod].window = window;
	mods[this.currentMod].save();
};

logic.menuSwitch = function(e) {
	var which = e.target;
	if (which.tagName == 'LI')
		which = which.children[0];
	
	which = which.innerText.trim();
	
	var ele = e.target;
	while (ele.tagName != 'UL')
		ele = ele.parentNode
	
	if (ele.parentNode.tagName != 'NAV')
		ele.style.display = 'none';
	
	switch (which) {
		
		//File
		case 'New': window.open('new', 'New Mod',
				'width=250,height=500,scrollbars=no,location=no'); break;
		case 'Open local':
			this.openMethod.nodeValue = 'Open local ';
			this.openLocal();
			break;
		case 'Save local':
			this.saveMethod.nodeValue = 'Save local ';
			this.saveLocal();
			break;
			
		//window
		case 'Terrain Editor': window.open('../editor'); break;
		case 'Code Editor': window.open('code'); break;
		
		default: console.log('"' + which + '"');
	}
	
	if (ele.parentNode.tagName != 'NAV')
		setTimeout(function() {
			ele.style.display = null;
		}, 50);
}
