Engine.Natives = function(engine) {
	this.engine = engine;
};

Engine.Natives.prototype.broadcast = function(args) {
	delete args._func;
	
	this.engine.core.host.broadcast(args);
};

Engine.Natives.prototype.newWidget = function(args) {
	delete args._func;
	
	var widget = new Engine.Widget(args);
	var id = this.engine.core.graphic.scene.children.indexOf(widget.mesh);
	widget.mesh.oid = id;
	widget.mesh.widget = widget;
	this.engine.widgets[id] = widget;
	
	this.engine.sandbox.postMessage({type: "local", data: {
		id: "widget",
		randID: args.randID,
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
