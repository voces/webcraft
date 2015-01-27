
/******************************************************************************
 ******************************************************************************
 **	Mods
 ******************************************************************************
 ******************************************************************************/

logic.setMod = function(modId) {
	
	this.currentMod = modId;
	
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

