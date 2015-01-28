
var mods = window.opener ?
		window.opener.mods || new Emitter([]) :
		new Emitter([]);

var logic = {
	
	initializers: [],
	
	graphic: null,
	
	//Objects we need
	keys: [],
	mouse: new THREE.Vector2(),
	mouseRaw: new THREE.Vector2(),
	raycaster: new THREE.Raycaster(),
	plane: null,
	
	activeTileMap: {},
	
	//Integer value of the currently loaded mod
	currentMod: null,
	
	//UI
	modCaret: null,
	modList: null,
	openMethod: null,
	saveMethod: null,
	
	windowActive: true,
	
	settings: {
		showPathingMap: false,
		transformations: [
		]
	},
	
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
		rate: 0.01,
		target: Math.PI * 17/90
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
		 **	terrainPalette
		 **************************************************************************/
		
		this.initTerrainPalette();
		
		/**************************************************************************
		 **	UI stuff
		 **************************************************************************/
		
		this.modCaret = document.getElementById('mod').children[0].children[0];
		this.modList = document.getElementById('mod').children[1];
		
		this.openMethod = document.getElementById('open').children[0].firstChild;
		this.saveMethod = document.getElementById('save').children[0].firstChild;
		
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
		 **	Events
		 **************************************************************************/
		
		//Keys
		window.addEventListener('keydown', this.onKeyDown.bind(this));
		window.addEventListener('keyup', this.onKeyUp.bind(this));
		
		//Mouse
		window.addEventListener('wheel', this.onScroll.bind(this));
		window.addEventListener('mousemove', this.onMouseMove.bind(this));
		
		//Menu
		document.getElementById('menu')
				.addEventListener('click', this.menuSwitch.bind(this));
		
		//Mods (other windows)
		mods.on("push", this.newMod.bind(this));
		mods.on("close", this.closeMod.bind(this));
		mods.on("savedStateChange", this.onSavedStateChange.bind(this));
		
		//Window
		window.addEventListener('focus', this.windowFocus.bind(this));
		window.addEventListener('blur', this.windowBlur.bind(this));
		
		/**************************************************************************
		 **	Some UI stuff (will probably remove)
		 **************************************************************************/
		
    var box = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100), new THREE.MeshPhongMaterial());
    box.castShadow = true;
    box.position.z = 192;
    this.graphic.scene.add(box);
    
		this.point = new Point(8, 0xffffff);
		this.graphic.scene.add(this.point);
		
		/**************************************************************************
		 **	Load attached initilizers
		 **************************************************************************/
		
		for (var i = 0; i < this.initializers.length; i++)
			this.initializers[i]();
		
    /**************************************************************************
		 **	Load our mods
		 **************************************************************************/
    
    for (var i = 0, mod; mod = mods[i]; i++)
			this.newMod({detail: {mod: mod}}, i);
		
		/**************************************************************************
		 **	Initial mod
		 **************************************************************************/
		
		if (mods.length != 0) return;
		
		//Create the mod
		var mod = new Mod({
			title: 'Untitled',
			author: 'Unknown',
			geoType: 'flat',
			height: 10,
			width: 15
		});
		var id = mods.push(mod) - 1;
		
		//Build an event
		mods.emit('push', new CustomEvent('push', {
			detail: {mod: mod, id: id}
		}));
		
	}
};

logic.getIntersect = function(mouse) {
	
	//Set our raycaster
	logic.raycaster.setFromCamera(mouse, logic.graphic.camera);
	
	//Cast it against the plane and grab the intersect
	var intersect = logic.raycaster.intersectObjects([logic.plane])[0];
	
	//Quit if no intersect
	if (!intersect) return null;
	
	//Adjust location of our UI point
	logic.point.position.copy(intersect.point);
	document.getElementById('status').textContent = 'Point (' +
			Math.round(intersect.point.x) + ', ' +
			Math.round(intersect.point.y) + ', ' +
			Math.round(intersect.point.z) + ')';
	
	//Grab the corresponding vertex (top left)
	var vertex;
	if (intersect.face.a + 1 == intersect.face.c)
		vertex = intersect.face.a;
	else
		vertex = intersect.face.c - 1;
	
	return vertex;
	
};

/******************************************************************************
 ******************************************************************************
 *	Events
 ******************************************************************************
 ******************************************************************************/

logic.onMouseMove = function(e) {
	
	//Store the raw location of the mouse
	this.mouseRaw.x = e.pageX;
	this.mouseRaw.y = e.pageY;
	
	//A switcher to determine if we're in preoview or world camera
	//	Used for camera movements/tilts
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
	
	//Normalize the mouse coordinates ([-1, 1], [-1, 1])
	this.mouse.x = ((e.clientX - 257) / (this.graphic.box.clientWidth - 257)) * 2 - 1;
	this.mouse.y = ((e.clientY - 33) / this.graphic.box.clientHeight) * -2 + 1;
	
	//Grab the vertex
	var vertex = this.getIntersect(this.mouse);
	
	//Quit if vertex is empty
	if (vertex == null) return;
	
	//Grab the width and height (width is + 1 for later calculations)
	var width = mods[this.currentMod].terrain.width;
	var height = mods[this.currentMod].terrain.height;
	
	//Convert vertex into tile
	tile = vertex - Math.floor(vertex / (width+1));
	
	//console.log(tile, vertex);
	
	//Get the coordinates of the tile
	var x = tile % width;
	var y = Math.floor(tile / width);
	
	//Clear the entire active canvas
	this.activeTileMap.context.clearRect(0, 0, width, height);
	
	//Set our color to green (selection)
	this.activeTileMap.context.fillStyle = '#010100';
	
	//Draw it
	this.activeTileMap.context.fillRect(x, y, 1, 1);
	
	//Recalc & update
	this.activeTileMap.merger.recalc();
	this.activeTileMap.texture.needsUpdate = true;
	
	logic.fireTransformers(vertex);
	
}
