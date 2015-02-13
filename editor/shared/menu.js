
(function(logic) {

var elMenu,
		elOpen,
		elSave,
		elMod,
		elModList,
		elModCaret;

var menuActions = {
	
	//File
	
	"New": function(){window.open('/editor/new', 'New Mod', 'width=250,height=500,scrollbars=no,location=no')},
	"Close": close,
	
	"Open file": openFile,
	"Save file": saveFile,
	
	//Window
	
	'Terrain Editor': function(){window.open('/editor')},
	'Code Editor': function(){window.open('/editor/code')},
};

function addMenuItem(name, callback) {
	menuActions[name] = callback;
}

/******************************************************************************
 ******************************************************************************
 **	File
 ******************************************************************************
 ******************************************************************************/

/******************************************************************************
 **	Close
 ******************************************************************************/

//Emits an event to close a mod
function close() {
	
	//Reject if no mod selected
	if (logic.currentMod == null) {
		message({
			error: true,
			text: 'No mod selected to close.'
		});
		
		return;
	}
	
  //For easy access
	var mod = mods[logic.currentMod];
  
  //If unsaved, prompt to verification to close
	if (!mod._saved && prompt('Are you sure you want to close ' + mod.meta.title +
			' without saving? (Type "yes" to continue.)') != 'yes')
		return;
  
  //Emit the close event
  mods.emit('close', new CustomEvent('close', {
    detail: {mod: mod, id: logic.currentMod}
  }));
  
}

/******************************************************************************
 **	Open
 ******************************************************************************/

//Will prompt for a file then load the file contents, pushing to mods and
//		emitting an event
function openFile() {
	
	elOpen.nodeValue = 'Open file ';
	
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
	
}

/******************************************************************************
 **	Save
 ******************************************************************************/

//If a mod is selected, will convert the mod into a .wcm file and start a
//		download
function saveFile() {
	
	elSave.nodeValue = 'Save file ';
	
	//Reject if no mod selected
	if (logic.currentMod == null) {
		message({
			error: true,
			text: 'You must select a mod to add a selection to.'
		});
		
		return;
	}
	
	//Set mod for easy access
	var mod = mods[logic.currentMod];
	
	//Set window of mod and convert to file text
	mod.window = window;
	file = mod.save();
	
	//Download for user
	download(mod.path() + '.wcm', file);
	
	//Set the mod state to saved
	setSavedStatus(true);
	
};

/******************************************************************************
 ******************************************************************************
 **	Window
 ******************************************************************************
 ******************************************************************************/

/******************************************************************************
 ******************************************************************************
 **	Mod
 ******************************************************************************
 ******************************************************************************/

/******************************************************************************
 ******************************************************************************
 **	Help
 ******************************************************************************
 ******************************************************************************/

/******************************************************************************
 ******************************************************************************
 **	Misc
 ******************************************************************************
 ******************************************************************************/

function onSavedStateChange(e) {
	
	//Grab the id of the mod
	var id = mods.indexOf(e.detail.mod);
	
	//Get the mod
	var mod = mods[id];
	
	//Update value in Mod list
	if (elMod) document.getElementById('mod_' + id).textContent = (e.detail.saved ? '' : '*') + mod.meta.title + ' - ' + mod.meta.version;
	
	logic.onSavedStateChange(e, id);
	
}

function setSavedStatus(saved) {
	if (logic.currentMod == null) return;
	
	mods[logic.currentMod].saved = saved;
}

//Called when the push event is emitted for mods
//	Takes in an event e, appends it to Mods menu and loads the terrain if the
//			window is focused or if none has been loaded before
function newMod(e) {
  
	//Only add a list item if the mod menu exists
	if (elMod) {
		
		//First mod, so add the caret
		elModCaret.style.display = 'inline-block'
	
		//Now let's create our new menu item & append it
		
		var listItem = document.createElement('li');
		
		var link = document.createElement('a');
		link.id = 'mod_' + e.detail.id;
		link.innerText = e.detail.mod.meta.title;
		
		listItem.appendChild(link);
		elModList.appendChild(listItem);
	}
	
	//Page-specific actions for loading mods
	logic.newMod(e);
	
}

//Closes a currently loaded mod (event-based)
function closeMod(e) {
  
  //Grab the id of what mod to close
  var id = e.detail.id;
  
  //Modify the global mods array and set its contents to null
  mods[id] = null;
  
	//Only modify menu items if it exists...
	if (elMod) {
	
		var listItem = document.getElementById('mod_' + id);
		var list = listItem.parentNode.parentNode;
		
		listItem.parentNode.remove();
		
		if (list.children.length == 0)
			elModCaret.style.display = 'none';
  
	}
	
	while (mods[--id] != null || id == 0) {}
	
	logic.setMod(id);
	
	//Page-specific actions for unloading mods
	logic.closeMod(e);
	
};

/******************************************************************************
 ******************************************************************************
 **	Switch
 ******************************************************************************
 ******************************************************************************/

function menuSwitch(e) {
	
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
	
	//A mod was selected, set it
	if (modId && modId.indexOf('_') >= 0) {
		modId = modId.split('_')[1];
		
		logic.setMod(modId);
		
		return;
	}
	
	/****************************************************************************
	 **	Otherwise standard menu item, navigate through
	 ****************************************************************************/
	
	//Get the text value
	which = which.textContent.trim();
	
	//And fire it
	for (var item in menuActions)
		if (menuActions.hasOwnProperty(item) && item == which) {
			menuActions[item]();
			return;
		}
	
	console.log(which);
	
	
	
	
		/*case 'Export terrain':
			this.exportTerrain();
			break;
		case 'Import terrain':
			this.importTerrain();
			break;
		
		//View
		case 'Show pathing map':
			this.togglePathingMap();
			break;*/
		
	
}

/******************************************************************************
 ******************************************************************************
 **	Loader
 ******************************************************************************
 ******************************************************************************/

function init() {
	
	/****************************************************************************
	 **	Elements
	 ****************************************************************************/
	
	elMenu = document.getElementById('menu');
	
	elOpen = document.getElementById('open').children[0].firstChild;
	elSave = document.getElementById('save').children[0].firstChild;
	
	elMod= document.getElementById('mod');
	
	if (elMod) {
		elModList = elMod.children[1];
		elModCaret = elMod.children[0].children[0];
	}
	
	/****************************************************************************
	 **	Events
	 ****************************************************************************/
	
	elMenu.addEventListener('click', menuSwitch);
	
	//Mods (other windows)
	mods.on("push", newMod);
	mods.on("close", closeMod);
	mods.on("savedStateChange", onSavedStateChange);
	
}

/******************************************************************************
 ******************************************************************************
 *	Export
 ******************************************************************************
 ******************************************************************************/

//Calls our init when the page loads
logic.initializers.push(init);

logic.menu = {
	newMod: newMod,
	add: addMenuItem
};

})(logic);
