
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
	
	//Integer value of the currently loaded mod
	currentMod: null,
	
	//UI
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

/******************************************************************************
 ******************************************************************************
 **	Mods
 ******************************************************************************
 ******************************************************************************/

logic.loadTerrain = function(terrain) {
  
  var geometry = new THREE.PlaneBufferGeometry(
      terrain.width*128, terrain.height*128,
      terrain.width, terrain.height);
  
	//OK, let's apply the height map...
	for (var i = 0; i < terrain.heightMap.length/3; i++)
		geometry.attributes.position.array[i*3+2] =
			terrain.heightMap[i*3]*32768 + 
			terrain.heightMap[i*3+1]*128 +
			terrain.heightMap[i*3+2]/2 -
			terrain.heightBias*32768-16192.5;
	
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
	link.id = 'mod_' + this.modList.children.length;
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
		
		if (e.deltaY < 0)
			this.zoomKey.target -= 32;
		else
			this.zoomKey.target += 32;
		
		if (this.graphic.keys.indexOf(this.zoomKey) < 0)
			this.graphic.keys.push(this.zoomKey);
		
	
	//ALT+Scroll = rotate along x (angle to ground)
	} else {
		
		if (e.deltaY < 0)
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

//Will prompt for a file then load the file contents, pushing to mods and
//		emitting an event
logic.openFile = function() {
	
	//Create input element for file upload
	var fileInput = document.createElement('input');
	fileInput.setAttribute('type', 'file');
	
	//Open the dialog
	fileInput.click();
	
	//Attach an event listener for when file is selected
	fileInput.addEventListener('change', function(e) {
		
		//Grab the file object
		var file = e.target.files[0];
		
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
			
			this.plane.geometry.attributes.position.needsUpdate = true;
			
		}.bind(this);
		
	}.bind(this), false);
	
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
		imageData.data[i*4+3] = 255;
		
	}
	
	context.putImageData(imageData, 0, 0);
	
	var link = document.createElement('a');
	link.setAttribute('href', canvas.toDataURL());
	link.setAttribute('download', mod.meta.title + '.png');
	link.click();
	
};

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
	
	//And the ID
	var modId = which.id;
	
	//
	if (modId && modId.indexOf('_') >= 0) {
		modId = modId.split('_')[1];
		console.log(modId);
		return;
	}
	
	/****************************************************************************
	 **	Otherwise standard menu item, navigate through
	 ****************************************************************************/
	
	if (which.tagName == 'LI')
		which = which.children[0];
	
	//Get the text value
	which = which.textContent .trim();
	
	//Now figure out what to do
	switch (which) {
		
		//File
		case 'New': window.open('new', 'New Mod',
				'width=250,height=500,scrollbars=no,location=no'); break;
		
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
		
		//window
		case 'Terrain Editor': window.open('../editor'); break;
		case 'Code Editor': window.open('code'); break;
		
		default: console.log('"' + which + '"');
	}
	
}
