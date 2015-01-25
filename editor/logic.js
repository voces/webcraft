
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
		window.addEventListener('click', this.onClick.bind(this));
		
		window.addEventListener('mousedown', this.onMouseDown.bind(this));
		window.addEventListener('mouseup', this.onMouseUp.bind(this));
		
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
		
    var box = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100), new THREE.MeshPhongMaterial());
    box.castShadow = true;
    box.position.z = 192;
    this.graphic.scene.add(box);
    
		this.point = new Point(8, 0xffffff);
		this.graphic.scene.add(this.point);
		
	}
};

/******************************************************************************
 ******************************************************************************
 **	Mods
 ******************************************************************************
 ******************************************************************************/

logic.setMod = function(modId) {
	
	this.currentMod = modId;
	
};

//Takes in a modId, an index in global mods, sets logic.currentMod, creates
//		geometry, modifies it with the heightmap, creates a basic material, and
//		merges it to a mesh, logic.plane, which is added to logic.graphic.scene
logic.loadTerrain = function(modId) {
  
	//Set current mod to input
	this.currentMod = modId;
	
	//For easy access
	var terrain = mods[modId].terrain;
	
	//Remove and delete the previous plane (if it existed)
	if (this.plane != null) {
		this.graphic.scene.remove(this.plane);
		this.plane = null;
	}
	
	//Create geometry
  var geometry = new THREE.PlaneBufferGeometry(
      terrain.width*128, terrain.height*128,
      terrain.width, terrain.height);
	
	//OK, let's apply the height map...
	for (var i = 0; i < terrain.heightMap.length; i++)
		geometry.attributes.position.array[i*3+2] = terrain.heightMap[i];
	
	//Build our active canvas layer (shows live selection, etc)
	this.activeTileMap.canvas = document.createElement('canvas');
	this.activeTileMap.canvas.width = terrain.width;
	this.activeTileMap.canvas.height = terrain.height;
	this.activeTileMap.context = this.activeTileMap.canvas.getContext('2d');
	
	this.activeTileMap.merger = new CanvasMerge(
		this.uintToCanvas(terrain.height, terrain.width, terrain.tileMapPathing, 2),
		this.activeTileMap.canvas
	);
	
	this.activeTileMap.texture = new THREE.Texture(this.activeTileMap.canvas);
	
  //Create our material, loading in our textures and tile maps
	var material = TileMaterial({
    width: terrain.width,
		height: terrain.height,
		tileTextures: terrain.tileTextures,
    tileMapBottom: new THREE.Texture(this.uintToCanvas(
        terrain.height, terrain.width, terrain.tileMapBottom, 3
    )),
    tileMapTop: new THREE.Texture(this.uintToCanvas(
        terrain.height, terrain.width, terrain.tileMapTop, 3
    )),
    tileMapInfo: this.activeTileMap.texture
    //tileMapInfo: terrain.tileMapActiveTexture
  });
	
	//Create the mesh
  this.plane = new THREE.Mesh(geometry, material);
  this.plane.receiveShadow = true;
  //this.plane.castShadow = true;
  
	//And add it
  this.graphic.scene.add(this.plane);
  
	//Update save status/title
	this.setSavedStatus(mods[modId]._saved);
	
	//Update our keys...
	
	this.panUDKey.min = terrain.height*-64 - 1024;
	this.panUDKey.max = terrain.height*64;// - 1024;
	
	this.panLRKey.min = terrain.width*-64 - 128;
	this.panLRKey.max = terrain.width*64 + 128;
	
};

//Called when the push event is emitted for mods
//	Takes in an event e, appends it to Mods menu and loads the terrain if the
//			window is focused or if none has been loaded before
logic.newMod = function(e) {
  
	//First mod, so add the caret
	this.modCaret.style.display = 'inline-block'
	
	//Now let's create our new menu item & append it
	
	var listItem = document.createElement('li');
	
	var link = document.createElement('a');
	link.id = 'mod_' + e.detail.id;
	link.innerText = e.detail.mod.meta.title;
	
	listItem.appendChild(link);
	this.modList.appendChild(listItem);
	
	//Okay, let's load the terrain if required
	if (this.windowActive || this.plane == null)
		this.loadTerrain(e.detail.id);
	
};

//Closes a currently loaded mod (event-based)
logic.closeMod = function(e) {
  
  //Grab the id of what mod to close
  var id = e.detail.id;
  
  //Modify the global mods array and set its contents to null
  mods[id] = null;
  
  var listItem = document.getElementById('mod_' + id);
  var list = listItem.parentNode.parentNode;
  
  listItem.parentNode.remove();
  
  if (list.children.length == 0)
    this.modCaret.style.display = 'none';
  
  //For unloading a plane if required
  if (this.currentMod != id) return;
  
  //Unload it
  this.graphic.scene.remove(this.plane);
  this.plane = null;
  
};

//Emits an event to close a mod
logic.close = function() {
	
	//Reject if no mod selected
	if (this.currentMod == null) {
		message({
			error: true,
			text: 'No mod selected to close.'
		});
		
		return;
	}
	
  //For easy access
	var mod = mods[this.currentMod];
  
  //If unsaved, prompt to verification to close
	if (!mod._saved && prompt('Are you sure you want to close ' + mod.meta.title +
			' without saving? (Type "yes" to continue.)') != 'yes')
		return;
  
  //Emit the close event
  mods.emit('close', new CustomEvent('close', {
    detail: {mod: mod, id: this.currentMod}
  }));
  
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
	
	var zoom = this.graphic.camera.position.z / 1792;
	
	//Left or right
	if (e.which == 37 || e.which == 39) {
		if (e.which == 37) this.panLRKey.amount = -4096 * zoom;
		else this.panLRKey.amount = 4096 * zoom;
		
		this.panLRKey.start = Date.now();
		this.panLRKey.last = this.panLRKey.start;
		
		this.graphic.keys.push(this.panLRKey);
		
	//Up or down
	} else if (e.which == 38 || e.which == 40) {
		if (e.which == 38) this.panUDKey.amount = 4096 * zoom;
		else this.panUDKey.amount = -4096 * zoom;
		
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
		
		if (e.deltaY < 0)
			this.zoomKey.target -= 32;
		else
			this.zoomKey.target += 32;
		
		if (this.graphic.keys.indexOf(this.zoomKey) < 0)
			this.graphic.keys.push(this.zoomKey);
		
	
	//ALT+Scroll = rotate along x (angle to ground)
	} else {
		
		if (e.deltaY < 0)
			this.angleKey.target = this.angleKey.target + Math.PI / 64;
		else
			this.angleKey.target = this.angleKey.target - Math.PI / 64;
		
		if (this.graphic.keys.indexOf(this.angleKey) < 0)
			this.graphic.keys.push(this.angleKey);
	
	}
}

logic.getIntersect = function(mouse) {
	
	//Set our raycaster
	this.raycaster.setFromCamera(mouse, this.graphic.camera);
	
	//Cast it against the plane and grab the intersect
	var intersect = this.raycaster.intersectObjects([this.plane])[0];
	
	//Quit if no intersect
	if (!intersect) return;
	
	//Adjust location of our UI point
	this.point.position.copy(intersect.point);
	document.getElementById('status').textContent = 'Point (' +
			Math.round(intersect.point.x) + ', ' +
			Math.round(intersect.point.y) + ', ' +
			Math.round(intersect.point.z) + ')';
	
	//Set position (vertex) array for easy access
	var arr = this.plane.geometry.attributes.position.array;
	
	//Grab the corresponding vertex (top left)
	var vertex;
	if ((intersect.face.a + intersect.face.b + intersect.face.c) % 3 == 2)
		vertex = intersect.face.a;
	else
		vertex = intersect.face.c - 1;
	
	return vertex;// - Math.floor(vertex / (mods[this.currentMod].terrain.width + 1));
	
};

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
	
	//Grab the width and height (width is + 1 for later calculations)
	var width = mods[this.currentMod].terrain.width;
	var height = mods[this.currentMod].terrain.height;
	
	//Convert vertex into tile
	tile = vertex - Math.floor(vertex / (width+1));
	
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
	
	for (var i = 0; i < this.settings.transformations.length; i++)
		this.settings.transformations[i](vertex);
	
}

logic.onClick = function(e) {
	
	//Normalize the mouse coordinates ([-1, 1], [-1, 1])
	this.mouse.x = ((e.clientX - 257) / (this.graphic.box.clientWidth - 257)) * 2 - 1;
	this.mouse.y = ((e.clientY - 33) / this.graphic.box.clientHeight) * -2 + 1;
	
	//Grab the vertex
	var vertex = this.getIntersect(this.mouse);
	
	this.heightTransform(vertex);
	
};

logic.heightTransform = function(vertex) {
	
	var width = mods[this.currentMod].terrain.width;
	var arr = this.plane.geometry.attributes.position.array;
	
	arr[vertex*3+2] += 8;
	arr[(vertex+1)*3+2] += 8;
	arr[(vertex+width+1)*3+2] += 8;
	arr[(vertex+width+2)*3+2] += 8;
	
	this.plane.geometry.computeVertexNormals();
	//this.plane.geometry.computeFaceNormals();
	
	this.plane.geometry.attributes.position.needsUpdate = true;
	
};

logic.onMouseDown = function(e) {
	
	if (e.target.id != 'world') return;
	
	this.settings.transformations.push(this.heightTransform.bind(this));
	
};

logic.onMouseUp = function(e) {
	
	if (e.target.id != 'world') return;
	
	this.settings.transformations.splice(
			this.settings.transformations.indexOf(this.heightTransform), 1);
};

/******************************************************************************
 **	Window
 ******************************************************************************/

logic.windowFocus = function(e) {
	this.windowActive = true;
};

logic.windowBlur = function(e) {
	this.windowActive = false;
};

logic.onSavedStateChange = function(e) {
	
	//Grab the id of the mod
	var id;
	for (var i = 0; i < mods.length; i++)
		if (mods[i] == e.detail.mod) {
			id = i;
			break;
		}
	
	//Get the current mod
	var mod = mods[this.currentMod];
	
	//Update value in Mod list
	document.getElementById('mod_' + id).textContent =
			(e.detail.saved ? '' : '*') + mod.meta.title + ' - ' + mod.meta.version;
	
	//Update window title if the mod matches current mod
	if (id == this.currentMod)
		document.title =
				(e.detail.saved ? '' : '*') + mod.meta.title + ' - Terrain Editor';
	
};

logic.setSavedStatus = function(saved) {
	if (this.currentMod == null) return;
	
	mods[this.currentMod].saved = saved;
};

/******************************************************************************
 ******************************************************************************
 **	Menu
 ******************************************************************************
 ******************************************************************************/

/******************************************************************************
 **	File
 ******************************************************************************/

//Will prompt for a file then load the file contents, pushing to mods and
//		emitting an event
logic.openFile = function() {
	
	//Create input element for file upload
	var fileInput = document.createElement('input');
	fileInput.setAttribute('type', 'file');
	document.body.appendChild(fileInput);
	
	//Attach an event listener for when file is selected
	fileInput.addEventListener('change', function(e) {
		
		//Grab the file object
		var file = fileInput.files[0];
		
		fileInput.remove();
		
		//Create a reader
		var fileReader = new FileReader();
		
		//When the file is finished reading
		fileReader.onload = function() {
			
			//Grab the contents
			var file = fileReader.result;
			
			//Load the mod and add the mods
			var mod = Mod.load(file);
			var id = mods.push(mod) - 1;
			
			//Emit the push event
			mods.emit('push', new CustomEvent('push', {
				detail: {mod: mod, id: id}
			}));
		}.bind(this);
		
		//Read the file
		fileReader.readAsText(file);
		
	}.bind(this), false);
	
	//Open the dialog
	fileInput.click();
	
};

//If a mod is selected, will convert the mod into a .wcm file and start a
//		download
logic.saveFile = function() {
	
	//Reject if no mod selected
	if (this.currentMod == null) {
		message({
			error: true,
			text: 'You must select a mod to add a selection to.'
		});
		
		return;
	}
	
	//Set mod for easy access
	var mod = mods[this.currentMod];
	
	//Set window of mod and convert to file text
	mod.window = window;
	file = mod.save();
	
	//Download for user
	download(mod.path() + '.wcm', file);
	
	//Set the mod state to saved
	this.setSavedStatus(true);
	
};

//If a mod is loaded, it will bring up a file dialog, once file is selected will
//		check if it matches mod dimensions (error if not), then modify the terrain
//		in mods and update the plane
logic.importTerrain = function() {
	
	//Can only export if we got a mod
	if (this.currentMod == null) {
		message({
			error: true,
			text: 'You must select a mod to add a selection to.'
		});
		
		return;
	}
	
	//Create an input for file importing
	var terrainInput = document.createElement('input');
	terrainInput.setAttribute('type', 'file');
	terrainInput.setAttribute('accepts', '.png,image/png');
	
	//Click it to bring up dialog
	terrainInput.click();
	
	//When the user finishes selecting a file
	terrainInput.addEventListener('change', function(e) {
		
		//Grab the file from the input
		var file = terrainInput.files[0];
		
		//Get mod/terrain for easy access
		var mod = mods[this.currentMod];
		var terrain = mod.terrain;
		
		//Create our canvas and set it
		var canvas = document.createElement('canvas');
		canvas.width = terrain.width+1;
		canvas.height = terrain.height+1;
		
		//Grab the context
		var context = canvas.getContext('2d');
		
		//Create an image so we can paint it to the context
		var img = new Image;
		img.src = URL.createObjectURL(file);
		
		//Wait for the image to load
		img.onload = function() {
			
			//Quit if image doesn't match mod dimensions
			if (img.width != canvas.width || img.height != canvas.height) {
				message({
					error: true,
					text: 'Image dimensions do not match mod dimensions.'
				});
				
				return;
			}
			
			//Draw it and revoke URL (otherwise leak)
			context.drawImage(img, 0, 0);
			URL.revokeObjectURL(img.src);
			
			//Export image data from canvas
			var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
			
			//Update both the heightMap and the mesh geometry
			for (var i = 0; i < terrain.heightMap.length/3; i++) {
				terrain.heightMap[i*3] = imageData.data[i*4];
				terrain.heightMap[i*3+1] = imageData.data[i*4+1];
				terrain.heightMap[i*3+2] = imageData.data[i*4+2];
				
				this.plane.geometry.attributes.position.array[i*3+2] =
					terrain.heightMap[i*3]*32768 + 
					terrain.heightMap[i*3+1]*128 +
					terrain.heightMap[i*3+2]/2 -
					terrain.heightBias*32768-16192.5;
			}
			
			//Reload the buffer
			this.plane.geometry.attributes.position.needsUpdate = true;
			
			//Set the mod state to unsaved
			this.setSavedStatus(false);
			
		}.bind(this);
		
	}.bind(this), false);
	
};

logic.uintToCanvas = function(height, width, data, samples) {
  
  if (typeof height == 'undefined' || typeof width == 'undefined' ||
      typeof data == 'undefined' || typeof samples == 'undefined') return;
  
  //Define a canvas
	var canvas = document.createElement('canvas');
	canvas.height = height;
	canvas.width = width;
	
	//Grab the context
	var context = canvas.getContext('2d');
	
	//And some image data to manipulate
	var imageData = context.createImageData(width, height);
  
  //Manipulate the image data with height/level data
	for (var i = 0; i < data.length/samples; i++) {
		
    if (samples >= 1) imageData.data[i*4] = data[i*samples];
    if (samples >= 2) imageData.data[i*4+1] = data[i*samples+1];
    if (samples >= 3) imageData.data[i*4+2] = data[i*samples+2];
    
    //Set alpha to 255 if not defined
    if (samples >= 4) imageData.data[i*4+3] = data[i*samples+3];
    else imageData.data[i*4+3] = 255;
		
	}
  
  //And now paint our data
  context.putImageData(imageData, 0, 0);
  
  return canvas;
  
};

logic.exportTerrain = function() {
	
	//Can only export if we got a mod
	if (this.currentMod == null) {
		message({
			error: true,
			text: 'You must select a mod to add a selection to.'
		});
		
		return;
	}
	
	//Grab mod and terrain for easy access
	var mod = mods[this.currentMod];
	var terrain = mod.terrain;
	
	//Define a canvas
	var canvas = document.createElement('canvas');
	canvas.height = terrain.height + 1;
	canvas.width = terrain.width + 1;
	
	//Grab the context
	var context = canvas.getContext('2d');
	
	//And some image data to manipulate
	var imageData = context.createImageData(canvas.width, canvas.height);
	
	//Manipualte the image data with height/level data
	for (var i = 0; i < terrain.heightMap.length/3; i++) {
		
		imageData.data[i*4] = terrain.heightMap[i*3];
		imageData.data[i*4+1] = terrain.heightMap[i*3+1];
		imageData.data[i*4+2] = terrain.heightMap[i*3+2];
		
		//Alpha affects put image, so it should be full
		imageData.data[i*4+3] = 127;
		
	}
	
	context.putImageData(imageData, 0, 0);
	
	var link = document.createElement('a');
	link.setAttribute('href', canvas.toDataURL());
	link.setAttribute('download', mod.meta.title + '.png');
	link.click();
	
};

/******************************************************************************
 **	View
 ******************************************************************************/

logic.togglePathingMap = function() {
	
	//Toggle it
	if (this.settings.showPathingMap)
		this.settings.showPathingMap = false;
	else
		this.settings.showPathingMap = true;
	
	//Update HTML
	document.getElementById('showPathingMap').dataset.enabled =
			this.settings.showPathingMap;
	
	//Switch to merger if showing pathing map
	if (this.settings.showPathingMap)
		this.activeTileMap.texture.image = this.activeTileMap.merger.canvas;
	
	//Otherwise switch to active
	else this.activeTileMap.texture.image = this.activeTileMap.canvas;
	
	//Refresh to show
	this.activeTileMap.texture.needsUpdate = true;
};

/******************************************************************************
 **	Main
 ******************************************************************************/

logic.menuSwitch = function(e) {
	
	/****************************************************************************
	 **	Hide/show the item
	 ****************************************************************************/
	
	//Find the containing list
	var ele = e.target;
	while (ele.tagName != 'UL')
		ele = ele.parentNode
	
	//If list isn't for the top-nav, disappear it
	if (ele.parentNode.tagName != 'NAV') {
		ele.style.display = 'none';
		
		//And make it reappear soon (it'll be hidden by CSS, though)
		setTimeout(function() {
			ele.style.display = null;
		}, 50);
	}
	
	/****************************************************************************
	 **	If a mod, select it
	 ****************************************************************************/
	
	//Get the clicked element
	var which = e.target;
	if (which.tagName == 'LI')
		which = which.children[0];
	
	//And the ID
	var modId = which.id;
	
	//
	if (modId && modId.indexOf('_') >= 0) {
		modId = modId.split('_')[1];
		
		this.currentMod = modId;
    this.loadTerrain(modId);
		
		return;
	}
	
	/****************************************************************************
	 **	Otherwise standard menu item, navigate through
	 ****************************************************************************/
	
	//Get the text value
	which = which.textContent.trim();
	
	//Now figure out what to do
	switch (which) {
		
		//File
		case 'New':
			window.open('new', 'New Mod',
					'width=250,height=500,scrollbars=no,location=no');
			break;
		case 'Close':
			this.close();
			break;
		
		case 'Open file':
			this.openMethod.nodeValue = 'Open file ';
			this.openFile();
			break;
		case 'Save file':
			this.saveMethod.nodeValue = 'Save file ';
			this.saveFile();
			break;
		
		case 'Export terrain':
			this.exportTerrain();
			break;
		case 'Import terrain':
			this.importTerrain();
			break;
		
		//View
		case 'Show pathing map':
			this.togglePathingMap();
			break;
		
		//Window
		case 'Terrain Editor': window.open('../editor'); break;
		case 'Code Editor': window.open('code'); break;
		
		default: console.log('"' + which + '"');
	}
	
}
