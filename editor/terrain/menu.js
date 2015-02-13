
(function(logic) {

/******************************************************************************
 ******************************************************************************
 **	File
 ******************************************************************************
 ******************************************************************************/

//If a mod is loaded, it will bring up a file dialog, once file is selected will
//		check if it matches mod dimensions (error if not), then modify the terrain
//		in mods and update the plane
function importTerrain() {
	
	//Can only export if we got a mod
	if (logic.currentMod == null) {
		message({
			error: true,
			text: 'You must select a mod to import on.'
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
		var mod = mods[logic.currentMod];
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
			for (var i = 0; i < terrain.heightMap.length; i++) {
				
				//Green flag is set, so positive
				if (imageData.data[i*4+1] >= 128) terrain.heightMap[i] = imageData.data[i*4] + ((imageData.data[i*4+1]-128) << 8);
				
				//Negative
				else terrain.heightMap[i] = -imageData.data[i*4+2] - (imageData.data[i*4+1] << 8);
				
				//Load it into the geometry
				logic.plane.geometry.attributes.position.array[i*3+2] = terrain.heightMap[i];
			}
			
			//Reload the buffer
			logic.plane.geometry.attributes.position.needsUpdate = true;
			logic.plane.geometry.computeVertexNormals();
			
			//Set the mod state to unsaved
			mod.saved = false;
			
		}.bind(this);
		
	}.bind(this), false);
	
}

function exportTerrain() {
	
	//Can only export if we got a mod
	if (logic.currentMod == null) {
		message({
			error: true,
			text: 'You must select a mod to export.'
		});
		
		return;
	}
	
	//Grab mod and terrain for easy access
	var mod = mods[logic.currentMod];
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
	var height;
	for (var i = 0; i < terrain.heightMap.length; i++) {
		
		height = terrain.heightMap[i];
		
		if (height < 0) {
			imageData.data[i*4+2] = (-height-1) & 0x00FF;
			imageData.data[i*4+1] = ((-height-1) & 0x7F00) >> 8;
		} else {
			imageData.data[i*4] = height & 0x00FF;
			imageData.data[i*4+1] = ((height & 0x7F00) >> 8) + 128;
		}
		
		//Alpha affects put image, so it should be full
		imageData.data[i*4+3] = 255;
		
	}
	
	context.putImageData(imageData, 0, 0);
	
	var link = document.createElement('a');
	link.setAttribute('href', canvas.toDataURL());
	link.setAttribute('download', mod.meta.title + '.png');
	link.click();
	
}

/******************************************************************************
 ******************************************************************************
 **	View
 ******************************************************************************
 ******************************************************************************/

function togglePathingMap() {
	
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
}

function init() {
	
	logic.menu.add('Export terrain', exportTerrain);
	logic.menu.add('Import terrain', importTerrain);
	
}

/******************************************************************************
 ******************************************************************************
 **	Export
 ******************************************************************************
 ******************************************************************************/

//Calls our init when the page loads
logic.initializers.push(init);

})(logic);
