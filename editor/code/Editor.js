//USE PROMISES
function Editor(logic) {
	Emitter.call(this);
	
	this.worker = new SharedWorker('../worker/worker.js');
	this.tree = [];
	
	//Ports
	this.worker.port.addEventListener('message',
			this.onMessage.bind(this));
	this.worker.port.start();
	
	//Listeners
	this.on('connect', this.onConnect);
	this.on('newMod', this.newMod);
	this.on('onRequest', this.onRequest);
}

Editor.prototype = Object.create(Emitter.prototype, {
	constructor: {
		value: Emitter
	}
});

Editor.prototype.onMessage = function(e) {
	var newEvent = new e.constructor(e.data.id, e);
	
	if (typeof e.data.id != 'undefined')
		this.fire(newEvent);
};

Editor.prototype.onConnect = function(e) {
	
	for (var i = 0; i < e.data.mods.length; i++)
		logic.mods.push({path: e.data.mods[i]});
	
	this.worker.port.postMessage({id: 'request', major: 'code'});
}

Editor.prototype.newMod = function(e) {
	
	var length = logic.mods.push({path: e.data.path});
	
	//First mod
	if (length == 1)
		editor.port.postMessage({
			id: 'request',
			which: e.data.which,
			major: 'code'
		});
};

Editor.prototype.addSection = function(id, value, code, parent) {
	
	if (parent)
		ui.tree.add({
			id: id,
			value: value
		}, null, parent);
	else
		ui.tree.add({
			id: id,
			value: value
		});
	
	parent = id;
	
	if (typeof code == "object")
		for (var sub in code)
			if (code.hasOwnProperty(sub) && sub != "_value")
				this.addSection(
					parent + '_' + sub,	//id
					sub,	//value
					code[sub],	//code
					parent	//parent
				);
};

Editor.prototype.onRequest = function(e) {
	
	DATA = e.data;
	
	//Ignore requests that are not code related
	if (e.data.major != 'code') return;
	
	//single item
	if (typeof e.data.list == 'undefined') {
	} else {
		var list = e.data.list;
		for (var i = 0; i < list.length; i++) {
			for (var n = 0; n < logic.mods.length; n++)
				if (logic.mods[n].path == list[i].path) {
					logic.mods[n].id = list[i].id;
					logic.mods[n].code = list[i].code;
					
					n = logic.mods.length;
				}
			
			this.addSection('m' + list[i].id, list[i].path, list[i].code);
		}
	}
	
	//If .which exists, we only have the code for one mod, otherwise all mods
	if (typeof e.data.which == 'undefined') {
	} else {
		
		//ui.tree.add({value: e.data.
		//tree.getItem(
	}
}	
