
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
	
	this.id = NaN;	//ID within scene
	this.randID = Math.random();	//ID used only for creation
	
	applyProperties(this, props);
	
	if (!localize)
		postMessage({
			_func: "newWidget", 
			position: this.position,
			offset: this.offset,
			model: this.model
		});
}

Widget.prototype.getX = function() {
	if (this._slide.start == NaN)
		return this.position.x;
	else {
		this.position.x = this._slide.startPosition.x + (Date.now() - this._slide.start)/1000 * this._slide.speed * Math.cos(this._slide.direction);
		
		var maxX = g(this, ["boundingBox", "max", "x"]);
		var minX = g(this, ["boundingBox", "min", "x"]);
		if (maxX !== false && maxX < this.position.x)
			this.position.x = maxX;
		else if (minX !== false && minX > this.position.x)
			this.position.x = minX;
		
		return this.position.x;
	}
};

Widget.prototype.getY = function() {
	if (this._slide.start == NaN)
		return this.position.y;
	else {
		this.position.y = this._slide.startPosition.y + (Date.now() - this._slide.start)/1000 * this._slide.speed * Math.sin(this._slide.direction);
		
		var maxY = g(this, ["boundingBox", "max", "y"]);
		var minY = g(this, ["boundingBox", "min", "y"]);
		if (maxY !== false && maxY < this.position.y)
			this.position.y = maxY;
		else if (minY !== false && minY > this.position.y)
			this.position.y = minY;
		
		return this.position.y;
	}
};

Widget.prototype.getPosition = function() {
	
	//Sliding is the only movement we have, so it's easy
	if (this._slide.start == NaN)
		return this.position;
	else {
		
		this.position.x = this._slide.startPosition.x + (Date.now() - this._slide.start)/1000 * this._slide.speed * Math.cos(this._slide.direction);
		this.position.y = this._slide.startPosition.y + (Date.now() - this._slide.start)/1000 * this._slide.speed * Math.cos(this._slide.direction);
		
		var maxX = g(this, ["boundingBox", "max", "x"]);
		var minX = g(this, ["boundingBox", "min", "x"]);
		if (maxX !== false && maxX < this.position.x)
			this.position.x = maxX;
		else if (minX !== false && minX > this.position.x)
			this.position.x = minX;
		
		var maxY = g(this, ["boundingBox", "max", "y"]);
		var minY = g(this, ["boundingBox", "min", "y"]);
		if (maxY !== false && maxY < this.position.y)
			this.position.y = maxY;
		else if (minY !== false && minY > this.position.y)
			this.position.y = minY;
		
		return this.position;
	}
};

Widget.prototype.slide = function(args) {
	
	if (
		typeof args.direction == "undefined" ||
		typeof args.timestamp == "undefined"
	) return;
	
	var startPosition = this.getPosition();
	
	applyProperties(this._slide, {
		start: args.timestamp,
		startPosition: startPosition,
		direction: args.direction,
		speed: args.speed || this.speed
	});
	
	postMessage({
		_func: "slide", 
		id: this.id,
		timestamp: args.timestamp,
		direction: args.direction,
		speed: this._slide.speed,
	});
};

Widget.prototype.stopSlide = function(args) {
	
	if (typeof args.timestamp == "undefined" || isNaN(this._slide.start)) return;
	
	this.position.x = this._slide.startPosition.x + (args.timestamp - this._slide.start)/1000 * this._slide.speed * Math.cos(this._slide.direction);
	this.position.y = this._slide.startPosition.y + (args.timestamp - this._slide.start)/1000 * this._slide.speed * Math.cos(this._slide.direction);
	
	this._slide.start = NaN;
	
	postMessage({
		_func: "stopSlide", 
		id: this.id,
		timestamp: args.timestamp,
		direction: args.direction,
		speed: this._slide.speed,
	});
};
