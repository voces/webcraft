

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
		
		this.setMod(modId);
		/*this.currentMod = modId;
    this.loadTerrain(modId);*/
		
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
