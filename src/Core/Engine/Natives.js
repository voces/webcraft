Engine.Natives = function(engine) {
	this.engine = engine;
};

Engine.Natives.prototype.newWidget = function(props) {
	var widget = new Engine.Widget({position: props.position, offset: props.offset, model: props.model});
	
	this.engine.sandbox.postMessage({type: "local", data: {
		id: "widget",
		randID: props.randID,
		position: widget.mesh.position,
		oid: this.engine.core.graphic.scene.children.indexOf(widget)
	}});
}
