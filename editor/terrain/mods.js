
(function(logic) {

/******************************************************************************
 **	Window
 ******************************************************************************/

windowFocus = function(e) {
	logic.windowActive = true;
};

windowBlur = function(e) {
	logic.windowActive = false;
};

//Called when the page loads
function init() {
	
	//For easy access
	var world = document.getElementById('world');
	
	//Set some objects that we have to wait for init for
	box = document.getElementById('box');
	camera = logic.graphic.camera;
	
	//Attach events
	window.addEventListener('focus', windowFocus);
	window.addEventListener('blur', windowBlur);
	
}

/******************************************************************************
 ******************************************************************************
 *	Export
 ******************************************************************************
 ******************************************************************************/

//Calls our init when the page loads
logic.initializers.push(init);

logic.setMod = function(modId) {
	
	logic.currentMod = modId;
	
	//If mod is valid...
	if (modId >= 0) {
		
		logic.loadTerrain(modId);
		logic.loadPaletteTextures(mods[modId].terrain.tileTextures);
	
	//Underflow, no mod loaded
	} else {
		logic.graphic.scene.remove(logic.plane);
		logic.plane = null;
		document.title = 'Terrain Editor';
	}
	
};

//Okay, let's load the terrain if required
logic.newMod = function(e) {
	
	if (logic.windowActive || logic.plane == null)
		logic.setMod(e.detail.id);
	
};

//Unload terrain if required
logic.closeMod = function(e) {
  
  //For unloading a plane if required
  if (logic.currentMod != e.detail.id) return;
  
  //Unload it
  logic.graphic.scene.remove(logic.plane);
  logic.plane = null;
  
};

logic.onSavedStateChange = function(e, id) {
	
	//Update window title if the mod matches current mod
	if (id == logic.currentMod)
		document.title = (e.detail.saved ? '' : '*') + e.detail.mod.meta.title + ' - Terrain Editor';
	
};

})(logic);
