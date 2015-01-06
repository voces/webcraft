
var mods = window.opener ?
		window.opener.mods || new Emitter([]) :
		new Emitter([]);

var logic = {
	
	currentMod: null,
	
	//UI objects
  openMethod: null,
	saveMethod: null,
	
	lastRenameEvent: 0,
	
	tree: null,
	coder: null,
  
  init: function() {
		
    /**************************************************************************
		 **	Build our UI context
		 **************************************************************************/
    
		//Bind elements
		
		this.openMethod = document.getElementById('open').firstChild;
		this.saveMethod = document.getElementById('save').firstChild;
		
		this.tree = document.getElementById('tree').children[0];
    
    //Events
		
    $('#menu').click(this.menuSwitch.bind(this));
		
		$('#tree').click(this.selectSection.bind(this));
		$('#tree').dblclick(this.renameSection.bind(this));
		
		$('#tree').focusout(this.finishRename.bind(this));
		
    /**************************************************************************
		 **	Coder
		 **************************************************************************/
    
		//$$('code').$view.id = 'code';
		
		this.coder = ace.edit('code');
		this.coder.$blockScrolling = Infinity;
    
		/**************************************************************************
		 **	Events
		 **************************************************************************/
		
		//Mods (other windows)
		mods.on("push", this.newMod.bind(this));
		
    /**************************************************************************
		 **	Load our mods
		 **************************************************************************/
    
    for (var i = 0, mod; mod = mods[i]; i++)
			this.newMod({detail: {mod: mod}}, i);
		
	}
};

/******************************************************************************
 ** Misc
 ******************************************************************************/

logic.idToCode = function(id) {
  
	//Split path into parts
  var path = id.split('_');
	
	//Grab the mod we need
  var section = mods[path.shift().substring(1)].code;
	
	//Loop until we've exhausted the path
	var next;
  while (path.length) {
		next = path.shift();
		
		//Loop until we've found the corret child
		for (var i = 0; section.children[i].name != next; i++) {}
		
		//Found it, set and repeat (or exit if finished)
    section = section.children[i];
		
	}
  
	//Found it!
  return section;
};

/******************************************************************************
 ******************************************************************************
 **	Interactivity
 ******************************************************************************
 ******************************************************************************/

logic.rFinishRename = function(li, oldName, newName) {
	
	//Update the input and label
	li.children[0].id = li.children[0].id.replace(oldName, newName);
	li.children[1].setAttribute('for',
			li.children[1].getAttribute('for').replace(oldName, newName));
	
	//And update any sublists
	var next = li.children[5];
	if (next)
		for (var i = 0, child; child = next.children[i]; i++)
			this.rFinishRename(child, oldName, newName);
	
};

logic.finishRename = function(e) {
	
	//Ignore if this function was called <10 MS ago
	if (e.timeStamp - this.lastRenameEvent < 10) {
		this.lastRenameEvent = e.timeStamp;
		return;
	}
	
	//Used to make sure focusout is ignored if it occurs because we entered...
	this.lastRenameEvent = e.timeStamp;
	
	//Ignore keyup events that are not enter-key related
	if (e.type == 'keyup' && e.which != 13) return;
	
	//Fix anything wonky (note HTML5 accepts anything except spaces, underscores
	//	are reserved to differentiate subsections)
	e.target.innerHTML = e.target.innerText
			.replace(/ /g, '&nbsp;')
			.replace(/_/g, '&nbsp;');
	
	//No more edits
	e.target.removeAttribute('contentEditable');
	
	//Grab the old and new names
	var oldName = e.target.oldText;
	var newName = e.target.innerText;
	
	//Quit if they didn't change anything
	if (oldName == newName) return;
	
	//Error, revert, and cancel if empty
	if (oldName == '') {
		e.target.innerText = e.target.oldText;
		
		message({
			error: true,
			text: 'Empty names not allowed.'
		});
		
		return;
	}
	
	//Grab info about the current item
	var curId = e.target.parentNode.children[0].id;
	var curItem = e.target.parentNode;
	
	//Get the id of parent and the suffix of current
	var parentId = curId.substr(0, curId.lastIndexOf('_'));
	
	//Now grab the section of code
	var parentSection = this.idToCode(parentId);
	
	//Find in code and check for duplicate names
	var childCode, duplicate = false;
	for (var i = 0, child; child = parentSection.children[i]; i++) {
		if (child.name == oldName) childCode = child;
		else if (child.name == newName) {
			duplicate = true;
			break;
		}
	}
	
	//Error, revert, and cancel if taken
	if (duplicate) {
		e.target.innerText = e.target.oldText;
		
		message({
			error: true,
			text: 'That name is already taken.'
		});
		
		return;
	}
	
	//Swap in code
	childCode.name = newName;
	
	//Swap in HTML
	this.rFinishRename(curItem, parentId + '_' + oldName,
			parentId + '_' + newName);
	
	//Update the saved status/title
	this.setSavedStatus(false);
	
};

logic.renameSection = function(e) {
  
	if (e.target.className == 'sectionName' &&
			e.target.parentNode.children[0].id.indexOf('_') > 0) {
		
		e.target.oldText = e.target.innerText;
		e.target.setAttribute('contentEditable', true);
		e.target.focus();
		selectText(e.target);
	}
	
};

logic.onChange = function(e, section) {
	
	//Update the code in mods
	section.code = this.coder.getValue();
	
	//Update the saved status/title
	this.setSavedStatus(false);
	
};

logic.selectSection = function(e) {
	
	//Section name selected, change code sessions
	if (e.target.className == 'sectionName') {
		
		//Get the id and update currentMod
		var id = e.target.parentNode.children[0].id;
		this.currentMod = id.split('_')[0].substr(1);
		
		//Grab the section
		var section = this.idToCode(id);
		
		//Create a session if it does not exist
		if (typeof section._session == "undefined") {
			section._session = ace.createEditSession(
				section.code, 'ace/mode/javascript'
			);
			
			
			//! This should emit an event on mods rather than bind an attachment
			//!		because the onChange event is local to the window
			section._session.on('change', function(e) {
				this.onChange(e, section);
			}.bind(this));
		}
		
		//Set the session
		this.coder.setSession(section._session);
	
		this.setSavedStatus(mods[this.currentMod]._saved);
		
	//New section clicked
	} else if (e.target.className == 'add') {
		
		//Grab the id
		var currentId = e.target.parentNode.parentNode.children[0].id;
		
		//Grab the section and define our first-pass section name
		var section = this.idToCode(currentId);
		var name = 'Untitled',
				num = '';
		
		//Children not defined, so just define it and we know it's not taken
		if (typeof section.children == 'undefined' || section.children == null)
			section.children = [];
		
		//Children is defined, so we must make sure we're unique
		else {
			
			//General flag for searching
			var flag = true;
			
			//Loop while flag is true
			while (flag) {
				
				//Set flag to false, meaning currently unfound
				flag = false;
				
				//Loop through all children
				for (var i = 0, child; child = section.children[i]; i++)
					
					//Name already taken, try again with num++
					if (child.name == name + num) {
						num = (parseInt(num) || 1) + 1;
						flag = true;
						break;
					}
			}
		}
		
		//Set name to include num (num may be blank)
		name += num;
		
		//Define the new section in code
		section.children.push({name: name, code: ''});
		
		//Add the new section to the tree
		this.loadSection(currentId + '_' + name, name, null, currentId);
		
		//Show the section if it's not
		e.target.parentNode.parentNode.children[0].checked = true
	
	//Remove section clicked
	} else if (e.target.className == 'remove') {
		
		//Grab info about the current item
		var curId = e.target.parentNode.parentNode.children[0].id;
		var curItem = e.target.parentNode.parentNode;
		var listNode = curItem.parentNode;
		
		//Verify they want to delete
		if (prompt('Are you sure you want to delete ' +
				curItem.children[3].innerText + ' (type "yes" to continue)?') != 'yes')
			return;
		
		//Get the id of parent
		var parentId = curId.substr(0, curId.lastIndexOf('_'));
		var curName = curId.substr(curId.lastIndexOf('_') + 1);
		
		//Now grab the section of code
		var parentSection = this.idToCode(parentId);
		
		//Remove in code
		for (var i = 0, child; child = parentSection.children[i]; i++)
			if (child.name == curName) {
				parentSection.children.splice(i, 1);
				break;
			}
		
		//Remove in HTML
		curItem.remove();
		
		//Hide the caret if now empty
		if (listNode.children.length == 0)
			listNode.parentNode.children[1].style.opacity = 0;
		
	}
	
};

/******************************************************************************
******************************************************************************
 **	Mods
 ******************************************************************************
 ******************************************************************************/

logic.newMod = function(e, version) {
	
	var mod = e.detail.mod;
	
	//If version is unset, just use length (it's probably from an event)
	if (typeof version == 'undefined')
		 version = mods.length - 1;
	
	//Okay, let's load the code
	this.loadSection(
			'm' + version,
			(mod._saved ? '' : '*') + mod.meta.title,
			mod.code.children
	);
	
};

//Adds a section to the tree
logic.loadSection = function(id, value, children, parent) {
  
  //If the parent exists, define it in the add, otherwise don't
	
	//Container for the entire section
	var li = document.createElement('li');
	
	//Used to control whether children are hidden/shown
	var input = document.createElement('input');
	input.setAttribute('type', 'checkbox');
	input.setAttribute('id', id);
	
	//Used to toggle hide/show of children (and display state)
	var caret = document.createElement('label');
	caret.setAttribute('for', id);
	caret.className = 'caret';
	
	//Input for the section label (used to highlight current code)
	var radio = document.createElement('input');
	radio.setAttribute('type', 'radio');
	radio.setAttribute('name', 'selectedSection');
	radio.setAttribute('id', 'r_' + id);
	
	//Used to toggle hide/show of children (and display state)
	var label = document.createElement('label');
	label.setAttribute('for', 'r_' + id);
	label.className = 'sectionName';
	label.innerText = value;
	label.addEventListener('keyup', this.finishRename.bind(this));
	
	//A container for controls (+/-)
	var controls = document.createElement('span');
	controls.className = 'controls';
	
	//Used to add a child
	var add = document.createElement('span');
	add.className = 'add';
	add.innerText = '+';
	
	//Used to remove current section
	var remove = document.createElement('span');
	remove.className = 'remove';
	remove.innerText = '–';
	
	//Build our controls
	controls.appendChild(add);
	if (id.indexOf('_') >= 0) controls.appendChild(remove);
	
	//And now build our item
	li.appendChild(input);
	li.appendChild(caret);
	li.appendChild(radio);
	li.appendChild(label);
	li.appendChild(controls);
	
	//Not a mod-level section, so we're adding to a list
  if (parent) {
		
		//Grab the parent and the list
		parentEle = document.getElementById(parent).parentNode;
		var childList = parentEle.children[5];
		
		//List doesn't exist yet so create it
		if (!childList) {
			childList = document.createElement('ul');
			parentEle.appendChild(childList);
		}
		
		//Append to list
		childList.appendChild(li);
		
		//Make sure parent caret is visible
		parentEle.children[1].style.opacity = 1;
	
	//Mod-level section
	} else this.tree.appendChild(li);
	
  //Set our parent, only used for possible children
	parent = id;
	
  //Make sure we're working with an object (Array)
	if (typeof children == 'object' && children != null)
    
    //Grab the children (not value)
		for (var i = 0, sub; sub = children[i]; i++)
      
			//Recursively add children
			this.loadSection(parent + '_' + sub.name, sub.name, sub.children, parent);
};

/******************************************************************************
 **	Window
 ******************************************************************************/

logic.setSavedStatus = function(saved) {
	if (this.currentMod == null) return;
	
	var mod = mods[this.currentMod];
	
	mod._saved = saved;
	
	document.title = (saved ? '' : '*') + mod.meta.title + ' - Code Editor';
	
	document.getElementById('m' + this.currentMod).parentNode.children[3]
			.firstChild.nodeValue = (saved ? '' : '*') + mod.meta.title;
	
};

/******************************************************************************
 ******************************************************************************
 **	Menu
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
	
	//Set the mod state to saved
	this.setSavedStatus(true);
	
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
		case 'New': window.open('../new', 'New Mod',
				'width=250,height=500,scrollbars=no,location=no'); break;
		
		case 'Open file':
			this.openMethod.nodeValue = 'Open file ';
			this.openFile();
			break;
		case 'Save file':
			this.saveMethod.nodeValue = 'Save file ';
			this.saveFile();
			break;
		
		//window
		case 'Terrain Editor': window.open('..'); break;
		case 'Code Editor': window.open('../code'); break;
		
		default: console.log('woot', which);
	}
	
	if (ele.parentNode.tagName != 'NAV')
		setTimeout(function() {
			ele.style.display = null;
		}, 50);
};
