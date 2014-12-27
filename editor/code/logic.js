
/***********************************
**	Primary Init
************************************/

var logic = {
	editor: null,
	mods: [],
	
	init: function() {
		
		logic.editor = new Editor(logic);
		
		ui.tree = $$('tree');
		
		ui.tree.attachEvent('onAfterSelect', logic.onAfterSelect);
		
		$$('code').$view.id = "code";
		
		ui.coder = ace.edit("code");
		ui.coder.$blockScrolling = Infinity;
		ui.coder.getSession().setMode("ace/mode/javascript");
		
	}
};

/***********************************
************************************
**	UI
************************************
************************************/

/***********************************
**	Interactivity
************************************/

logic.newSection = function() {
	var parentId = ui.tree.getSelectedId();
	var parent = ui.tree.getSelectedItem();
	
	DATAS = [parentId, parent];
	
	if (!parent) {
		webix.message({
			type:"error",
			text:"You must select a mod to add a selection to."
		});
		return;
	}
	
	var value = "Untitled";
	
	ui.tree.add({
		id: value,
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
		case 'New section': logic.newSection(); break;
		
		//window
		case 'Terrain Editor': window.open('..'); break;
		case 'Code Editor': window.open('../code'); break;
		
		default: console.log('woot');
	}
};

logic.onAfterSelect = function(id) {
	console.log(id);
	var path = id.split("_");
	
	var mod = logic.mods[path.shift().substring(1)];
	var section = mod.code;
	
	for (var i = 0; i < path.length; i++)
		section = section[path.shift()];
	
	ui.coder.setValue(section._value);
	ui.coder.selection.clearSelection();
	
	console.log(section);
	
};
