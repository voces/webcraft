Engine.Natives = function(engine) {
	this.engine = engine;
};

Engine.Natives.prototype.broadcast = function(args) {
	delete args._func;
	
	this.engine.core.host.broadcast(args);
};

Engine.Natives.prototype.createWidget = function(args) {
	delete args._func;
	
	var widget = new Engine.Widget(args);
	var id = this.engine.core.graphic.scene.children.indexOf(widget.mesh);
	widget.mesh.oid = id;
	widget.mesh.widget = widget;
	this.engine.widgets[id] = widget;
	
	this.engine.sandbox.postMessage({type: "local", data: {
		id: "createWidget",
		tempID: args.tempID,
		position: widget.mesh.position,
		oid: id
	}});
};

Engine.Natives.prototype.slide = function(args) {
	delete args._func;
	var id = args.id;
	delete args.id;
	
	this.engine.widgets[id].slide(args);
};

Engine.Natives.prototype.stopSlide = function(args) {
	delete args._func;
	var id = args.id;
	delete args.id;
	
	this.engine.widgets[id].stopSlide(args);
};

Engine.Natives.prototype.addHTML = function(args) {
	if (!args.html || typeof args.html != "object") throw("Bad arguments for addHTML");
	
	if (args.html instanceof Array)
		for (var i = 0; i < args.html.length; i++)
			this.engine.addElement(args.html[i]);
	else
		this.engine.addElement(args.html);
};
