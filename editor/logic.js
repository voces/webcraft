
var mods = window.opener ? window.opener.mods : new Emitter([]);

var logic = {
	
	graphic: null,
	
	//Objects we need
	keys: [],
	mouse: new THREE.Vector2(),
	raycaster: new THREE.Raycaster(),
	plane: null,
	
	localFileInput: document.createElement('input'),
	fileReader: new FileReader(),
	
	currentMod: null,
	
	/****************************************************************************
	 *	Build any keys we might want
	 ****************************************************************************/
	
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
		 **	Build our graphics and attach graphic-related values
		 **************************************************************************/
		
		//The object
		this.graphic = new Graphic("worldContainer", "world");
		
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
		$("#world").bind('mousewheel', this.onScroll.bind(this));
		$("#world").mousemove(this.onMouseMove.bind(this));
		
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
  
  var terrain = e.detail.mod.terrain;
  
  if (this.plane == null) {
		this.currentMod = e.detail.id;
    this.loadTerrain(terrain);
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
	
	this.mouse.x = (e.offsetX / this.graphic.container.clientWidth) * 2 - 1;
	this.mouse.y = (e.offsetY / this.graphic.container.clientHeight) * 2 - 1;
	
	this.raycaster.setFromCamera(this.mouse, this.graphic.camera);
	
	var intersects = this.raycaster.intersectObjects(this.graphic.scene.children);
	
	if (intersects.length) {
		OBJS = intersects;
		
		intersects[0].face.color = new THREE.Color(0xf2b640);
		intersects[0].object.geometry.__dirtyColors = true;
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
	
	if (this.currentMod) {
		webix.message({
			type: 'error',
			text: 'You must select a mod to add a selection to.'
		});
		return;
	}
	
	mods[this.currentMod].window = window;
	mods[this.currentMod].save();
};

logic.menuSwitch = function(id) {
	var which = $$('mainMenu').getMenuItem(id).value;
	console.log(this);
	switch (which) {
		
		//File
		case 'New': window.open('new', 'New Mod',
				'width=250,height=500,scrollbars=no,location=no'); break;
		case 'Open local': this.openLocal(); break;
		case 'Save local': this.saveLocal(); break;
			
		//window
		case 'Terrain Editor': window.open('../editor'); break;
		case 'Code Editor': window.open('code'); break;
		
		default: console.log('woot');
	}
}
