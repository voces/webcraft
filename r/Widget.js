
//Requires applyProperties.js
function Widget(props, localize) {
	this.position = {
		x: 0,
		y: 0,
		z: 0
	};
	
	this.offset = {
		x: 0,
		y: 0,
		z: 0
	};
	
	this.model = {
		type:  "simple",
		geometry: {
			shape: "BoxGeometry",
			size: {
				width:  100,
				height: 100,
				depth:  100
			}
		},
		material: {
			type: "MeshLambertMaterial",
			color: "white"
		}
	};
	
	this.collison = 0;
	
	this.pathingmap = [
		{x: -0.5, y: -0.5},
		{x: -0.5, y:  0.5},
		{x:  0.5, y: -0.5},
		{x:  0.5, y:  0.5}
	];
	
	this.randID = Date.now() + Math.random();
	
	applyProperties(this, props);
	
	if (!localize)
		postMessage({
			_func: "newWidget", 
			position: this.position,
			offset: this.offset,
			model: this.model
		});
}
