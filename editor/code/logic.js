
var mods = window.opener ? window.opener.mods : new Emitter([]);

var logic = {
  tree: null,
  coder: null,
  
  init: function() {
		
    /**************************************************************************
		 **	Build our UI context
		 **************************************************************************/
    
    //Stuff
		this.tree = $$('tree');
    this.tree.prevSection = null
		
    //Events
    this.tree.attachEvent('onAfterSelect', this.onAfterSelect.bind(this));
		
    /**************************************************************************
		 **	Coder
		 **************************************************************************/
    
		$$('code').$view.id = 'code';
		
		this.coder = ace.edit('code');
		this.coder.$blockScrolling = Infinity;
    
    /**************************************************************************
		 **	Load our mods
		 **************************************************************************/
    
    for (var i = 0; i < mods.length; i++)
      this.loadSection('m' + i, mods[i].path(), mods[i].code);
    
	}
};

/******************************************************************************
 ******************************************************************************
 **	UI
 ******************************************************************************
 ******************************************************************************/

logic.idToCode = function(id) {
  
  var path = id.split('_');
	
  var section = mods[path.shift().substring(1)].code;
	
  while (path.length)
    section = section[path.shift()];
  
  return section;
};

/******************************************************************************
 **	Builder
 ******************************************************************************/

/**
 * Adds a section to the tree
 * @param {string|number} id The view_id of the section (Webix)
 * @param {string} value The display text
 * @param {object} code An object containing at least _value, possibly children
 * @param {string|number|null} parent The id of the parent (see param1)
 */
logic.loadSection = function(id, value, code, parent) {
  
  //If the parent exists, define it in the add, otherwise don't
  if (parent)
		this.tree.add({
			id: id,
			value: value
		}, null, parent);
	else
		this.tree.add({
			id: id,
			value: value
		});
	
  //Set our parent, only used for possible children
	parent = id;
	
  //Make sure we're working with an object
	if (typeof code == 'object')
    
    //Grab the children (not value)
		for (var sub in code)
      if (code.hasOwnProperty(sub) && sub != '_value' && sub != '_session')
        
        //Recursively add children
				this.loadSection(parent + '_' + sub, sub, code[sub], parent);
};

/******************************************************************************
 **	Interactivity
 ******************************************************************************/

/**
 * Renames a section using an ugly prompt
 * 
 */
logic.renameSection = function() {
  
  //Grab info about the current item
  var curId = this.tree.getSelectedId();
  var curItem = this.tree.getSelectedItem();
  
  //Get the id of parent and the suffix of current
  var parentId = curId.substr(0, curId.lastIndexOf('_'));
  var oldName = curId.substr(curId.lastIndexOf('_') + 1);
  
  //Now grab the section of code
  var parentSection = this.idToCode(parentId);
  
  //We got everything, prompt a new name
  var newName = prompt('Rename section to:');
  
  //Swap in code
  parentSection[newName] = parentSection[oldName];
  delete parentSection[oldName];
  
  //Swap in HTML
  this.tree.data.changeId(curId, parentId + '_' + newName);
  curItem.value = newName;
  
  //And update webix
  this.tree.refresh();
  
};
 
logic.newSection = function() {
	var parentId = this.tree.getSelectedId();
	var parent = this.tree.getSelectedItem();
	
	if (!parent) {
		webix.message({
			type: 'error',
			text: 'You must select a mod to add a selection to.'
		});
		return;
	}
	
  var section = this.idToCode(parentId);
  var value = 'Untitled';
  
  if (typeof section[value] != 'undefined') {
    var num = 2;
    
    while (typeof section[value + ' ' + num] != 'undefined')
      num++;
    
    value = value + ' ' + num;
  }
  
	section[value] = {_value: ''};
  
	this.tree.add({
		id: parentId + "_" + value,
		value: value
	}, null, parentId);
};

logic.menuSwitch = function(id) {
	var which = $$('mainMenu').getMenuItem(id).value;
	
	switch (which) {
		
		//File
		case 'New': window.open('new', 'New Mod',
				'width=250,height=500,scrollbars=no,location=no'); break;
		
		//Edit
		case 'Rename section': this.renameSection(); break;
		case 'New section': this.newSection(); break;
		
		//window
		case 'Terrain Editor': window.open('..'); break;
		case 'Code Editor': window.open('../code'); break;
		
		default: console.log('woot');
	}
};

logic.onChange = function(e, section) {
  section._value = this.coder.getValue();
};

logic.onAfterSelect = function(id) {
	
  //Grab the section
  var section = this.idToCode(id);
  
  //Create a session if it does not exist
  if (typeof section._session == "undefined") {
    section._session = ace.createEditSession(
      section._value, 'ace/mode/javascript'
    );
    
    section._session.on('change', function(e) {
      this.onChange(e, section);
    }.bind(this));
  }
  
  //Set the session
  this.coder.setSession(section._session);
  
};
