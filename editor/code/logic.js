
var mods = window.opener ?
		window.opener.mods || new Emitter([]) :
		new Emitter([]);

var logic = {
	
	initializers: [],
	
	currentMod: -1,
	
	lastRenameEvent: 0,
	
	tree: null,
	coder: null,
  
  init: function() {
		
    /**************************************************************************
		 **	Build our UI context
		 **************************************************************************/
    
		//Bind elements
		
		this.tree = document.getElementById('tree').children[0];
    
		this.coder = ace.edit('code');
		this.coder.$blockScrolling = Infinity;
    
		/**************************************************************************
		 **	Events
		 **************************************************************************/
		
		//User types something in the code window, update UI (saved/unsaved)
		document.getElementById('code').addEventListener('keydown',
				this.codeChange.bind(this));
		
		/**************************************************************************
		 **	Load attached initilizers
		 **************************************************************************/
		
		for (var i = 0; i < this.initializers.length; i++)
			this.initializers[i]();
		
    /**************************************************************************
		 **	Load our mods
		 **************************************************************************/
    
    for (var i = 0; i < mods.length; i++)
			if (mods[i] != null)
				this.menu.newMod({detail: {mod: mods[i], id: i}}, i);
		
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
	mods[this.currentMod].saved = false;
	
	
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

//Called when any code is modified, updates title/tree to show unsaved
logic.codeChange = function(e) {
	
	//Only does anything if a mod is selected
	if (this.currentMod == null) return;
	
	//Update the saved status/title
	mods[this.currentMod].saved = false;
	
};

//Occurs when the section label is clicked; loads the section into code
logic.selectSection = function(e) {
	
	var oldMod = this.currentMod;
	
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
		
		//Updates code on change
		section._session.on('change', function(e) {
			
			//Update the code in mods
			section.code = this.coder.getValue();
			
		}.bind(this));
	}
	
	//Set the session
	this.coder.setSession(section._session);
	
	if (this.currentMod != oldMod)
		mods[this.currentMod].saved = mods[this.currentMod].saved;
	
};

//Occurs when the add (+) is clicked on a section; adds a section (does not
//		load)
logic.addSection = function(e) {
	
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
	
};

//Occurs when the remove (-) is clicked on a section; prompts to remove a
//		section and does so if yes
logic.removeSection = function(e) {
	
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
			(mod.saved ? '' : '*') + mod.meta.title,
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
	
	label.addEventListener('click', this.selectSection.bind(this));
	label.addEventListener('dblclick', this.renameSection.bind(this));
	label.addEventListener('keyup', this.finishRename.bind(this));
	label.addEventListener('focusout', this.finishRename.bind(this));
	
	//A container for controls (+/-)
	var controls = document.createElement('span');
	controls.className = 'controls';
	
	//Used to add a child
	var add = document.createElement('span');
	add.className = 'add';
	add.innerText = '+';
	
	add.addEventListener('click', this.addSection.bind(this));
	
	//Used to remove current section
	var remove = document.createElement('span');
	remove.className = 'remove';
	remove.innerText = '–';
	
	remove.addEventListener('click', this.removeSection.bind(this));
	
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

logic.onSavedStateChange = function(e, id) {
	if (this.currentMod == null) return;
	
	var mod = mods[this.currentMod];
	
	if (id == this.currentMod)
		document.title = (mod.saved ? '' : '*') + mod.meta.title + ' - Code Editor';
	
	document.getElementById('m' + id).parentNode.children[3]
			.firstChild.nodeValue = (mod.saved ? '' : '*') + mod.meta.title;
	
};
