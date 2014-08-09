
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

Engine.Natives.prototype.updateWidget = function(args) {
	this.engine.widgets[args.id].update(args);
};

Engine.Natives.prototype.setWidgetSpeed = function(args) {
	this.engine.widgets[args.id].setSpeed(args);
};

Engine.Natives.prototype.setWidgetPosition = function(args) {
	this.engine.widgets[args.id].setPosition(args);
};

Engine.Natives.prototype.setWidgetX = function(args) {
	this.engine.widgets[args.id].setX(args);
};

Engine.Natives.prototype.setWidgetY = function(args) {
	this.engine.widgets[args.id].setY(args);
};

Engine.Natives.prototype.slideWidget = function(args) {
	this.engine.widgets[args.id].slide(args);
};

Engine.Natives.prototype.stopWidgetSlide = function(args) {
	this.engine.widgets[args.id].stopSlide(args);
};

Engine.Natives.prototype.addHTML = function(args) {
	
	if (!args.html || typeof args.html != "object") throw "Bad arguments for addHTML"
	
	if (args.html instanceof Array)
		for (var i = 0; i < args.html.length; i++)
			this.engine.addElement(args.html[i]);
	else
		this.engine.addElement(args.html);
};

Engine.Natives.prototype.setText = function(args) {
	this.engine.elements[args.id].text(args.text);
};

Engine.Natives.prototype.removeElement = function(args) {
	var element = this.engine.elements[args.id];
	
	var index = this.engine.elements.indexOf(element);
	this.engine.elements.splice(index, 1);
	
	element.remove();
};

Engine.Natives.prototype.emptyElement = function(args) {
	var element = this.engine.elements[args.id];
	
	element.children().each(function(i, v) {
		var id = $(v).attr("id");
		
		if (id) delete this.engine.elements[id];
		$(v).remove();
	}.bind(this));
};
