Type = function(data) {
	this.name = "Dummy";
	this.grid = false;
	this.geometry = {
		shape: "Cube",
		size: 1,	//when cube, side length
		widthSeg: 24,
		heightSeg: 18
	};
	this.pathingmap = {
		shape: "octagon",
		sides: 8,
		size: .4	//side length
	};
	this.polygon = [];
	
	if (isset(data.grid)) this.grid = data.grid;
	if (isset(data.name)) this.name = data.name;
	if (isset(data.size)) this.size = data.size;
	if (isset(data.geometry)) {
		if (isset(data.geometry.shape)) this.geometry.shape = data.geometry.shape;
		if (isset(data.geometry.size)) this.geometry.size = parseFloat(data.geometry.size);
		if (isset(data.geometry.widthSeg)) this.geometry.widthSeg = data.geometry.widthSeg;
		if (isset(data.geometry.heightSeg)) this.geometry.heightSeg = data.geometry.heightSeg;
	}
	if (isset(data.pathingmap)) {
		if (isset(data.pathingmap.shape)) this.pathingmap.shape = data.pathingmap.shape;
		if (isset(data.pathingmap.sides)) this.pathingmap.sides = data.pathingmap.sides;
		if (isset(data.pathingmap.size)) this.pathingmap.size = data.pathingmap.size;
	}
	
	//calculate max radius
	if (this.pathingmap.shape == "octagon") {
		this.pathingmap.maxRadius = .5;
	}
	
	//increase our global max radius for objects if need be...
	if (this.maxRadius > e.maxRadius) e.maxRadius = this.maxRadius;
	
	//Calculator our polygon
	for (var i = 0; i <= this.pathingmap.sides; i++) {
		this.polygon.push(e.vectorMap.polarProject(0, 0, this.pathingmap.size, 2*Math.PI*(i/this.pathingmap.sides)));
	}
}

Player.prototype.toString = function() {
	return this.name;
}