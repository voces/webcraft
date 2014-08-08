
/*
	Requires
		applyProperties.js
		local.js
	
	Provides
		Widget(Object props, Boolean localize)
		Array widgets
*/

var widgets = [];

function Widget(props, localize) {
	
	/**********************************
	**	Position
	**********************************/
	
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
	
	/**********************************
	**	Collision/Movement
	**********************************/
	
	//Radial collision
	this.collision = 0;
	
	//Area it takes up
	this.pathingmap = [
		{x: -0.5, y: -0.5},
		{x: -0.5, y:  0.5},
		{x:  0.5, y: -0.5},
		{x:  0.5, y:  0.5}
	];
	
	this.speed = 0;
	
	//Limits on where the Widget can go
	this.boundingBox = {
		max: {
			x: NaN,
			y: NaN
		},
		min: {
			x: NaN,
			y: NaN
		}
	};
	
	//Internal object for sliding
	this._slide = {
		start: NaN,
		startPosition: {
			x: NaN,
			y: NaN
		},
		direction: NaN,
		speed: NaN
	};
	
	/**********************************
	**	Looks
	**********************************/
	
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
	
	/**********************************
	**	Finish (ID, applied properties, and engine communication)
	**********************************/
	
	this.id = NaN;								//ID within scene
	this.tempID = Date.now() + Math.random();	//ID used only for creation
	
	widgets.push(this);
	
	applyProperties(this, props);
	
	if (localize !== true)
		postMessage({
			_func: "createWidget", 
			tempID: this.tempID,
			position: this.position,
			offset: this.offset,
			boundingBox: this.boundingBox,
			model: this.model
		});
}


Widget.prototype.setSpeed = function(args) {
	this.speed = args.speed;
	
	var startPosition = this.getPosition();
	
	if (!isNaN(this._slide.start))
		applyProperties(this._slide, {
			start: args.timestamp,
			startPosition: startPosition,
			speed: this.speed
		});
	
	postMessage({
		_func: "setX", 
		id: this.id,
		timestamp: args.timestamp,
		speed: args.speed
	});
};


Widget.prototype.setPosition = function(args) {
	this.position = args.position;
	
	if (this.boundingBox.max.x < this.position.x)
		this.position.x = this.boundingBox.max.x;
	else if (this.boundingBox.min.x > this.position.x)
		this.position.x = this.boundingBox.min.x;
	
	if (this.boundingBox.max.y < this.position.y)
		this.position.y = this.boundingBox.max.y;
	else if (this.boundingBox.min.y > this.position.y)
		this.position.y = this.boundingBox.min.y;
	
	if (!isNaN(this._slide.start)) {
		this._slide.startPosition = this.position;
		this._slide.start = args.timestamp;
	}
	
	postMessage({
		_func: "setPosition", 
		id: this.id,
		timestamp: args.timestamp,
		position: args.position
	});
};

Widget.prototype.setX = function(args) {
	this.position.x = args.x;
	
	if (this.boundingBox.max.x < this.position.x)
		this.position.x = this.boundingBox.max.x;
	else if (this.boundingBox.min.x > this.position.x)
		this.position.x = this.boundingBox.min.x;
	
	if (!isNaN(this._slide.start)) {
		this._slide.startPosition = this.position;
		this._slide.start = args.timestamp;
	}
	
	postMessage({
		_func: "setX", 
		id: this.id,
		timestamp: args.timestamp,
		x: args.x
	});
};

Widget.prototype.setY = function(args) {
	this.position.y = args.y;
	
	if (this.boundingBox.max.y < this.position.y)
		this.position.y = this.boundingBox.max.y;
	else if (this.boundingBox.min.y > this.position.y)
		this.position.y = this.boundingBox.min.y;
	
	if (!isNaN(this._slide.start)) {
		this._slide.startPosition = this.position;
		this._slide.start = args.timestamp;
	}
	
	postMessage({
		_func: "setY", 
		id: this.id,
		timestamp: args.timestamp,
		y: args.y
	});
};

Widget.prototype.getX = function(timestamp) {
	
	if (typeof timestamp == "undefined") timestamp = Date.now();
	
	if (isNaN(this._slide.start))
		return this.position.x;
	else {
		this.position.x = this._slide.startPosition.x + (Date.now() - this._slide.start)/1000 * this._slide.speed * Math.cos(this._slide.direction);
		
		if (this.boundingBox.max.x < this.position.x)
			this.position.x = this.boundingBox.max.x;
		else if (this.boundingBox.min.x > this.position.x)
			this.position.x = this.boundingBox.min.x;
		
		return this.position.x;
	}
};

Widget.prototype.getY = function(timestamp) {
	
	if (typeof timestamp == "undefined") timestamp = Date.now();
	
	if (isNaN(this._slide.start))
		return this.position.y;
	else {
		this.position.y = this._slide.startPosition.y + (Date.now() - this._slide.start)/1000 * this._slide.speed * Math.sin(this._slide.direction);
		
		if (this.boundingBox.max.y < this.position.y)
			this.position.y = this.boundingBox.max.y;
		else if (this.boundingBox.min.y > this.position.y)
			this.position.y = this.boundingBox.min.y;
		
		return this.position.y;
	}
};

Widget.prototype.getPosition = function(timestamp) {
	
	if (typeof timestamp == "undefined") timestamp = Date.now();
	
	//Sliding is the only movement we have, so it's easy
	if (isNaN(this._slide.start))
		return new Point(this.position.x, this.position.y);
	else {
		this.position.x = this._slide.startPosition.x + (timestamp - this._slide.start)/1000 * this._slide.speed * Math.cos(this._slide.direction);
		this.position.y = this._slide.startPosition.y + (timestamp - this._slide.start)/1000 * this._slide.speed * Math.sin(this._slide.direction);
		
		if (this.boundingBox.max.x < this.position.x)
			this.position.x = this.boundingBox.max.x;
		else if (this.boundingBox.min.x > this.position.x)
			this.position.x = this.boundingBox.min.x;
		
		if (this.boundingBox.max.y < this.position.y)
			this.position.y = this.boundingBox.max.y;
		else if (this.boundingBox.min.y > this.position.y)
			this.position.y = this.boundingBox.min.y;
		
		return new Point(this.position.x, this.position.y);
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
	
	if (
		typeof args.timestamp == "undefined" ||
		isNaN(this._slide.start) ||
		(typeof args.direction != "undefined" && this._slide.direction != args.direction)
	) return;
	
	this.position.x = this._slide.startPosition.x + (args.timestamp - this._slide.start)/1000 * this._slide.speed * Math.cos(this._slide.direction);
	this.position.y = this._slide.startPosition.y + (args.timestamp - this._slide.start)/1000 * this._slide.speed * Math.sin(this._slide.direction);
	
	if (this.boundingBox.max.x < this.position.x)
		this.position.x = this.boundingBox.max.x;
	else if (this.boundingBox.min.x > this.position.x)
		this.position.x = this.boundingBox.min.x;
	
	if (this.boundingBox.max.y < this.position.y)
		this.position.y = this.boundingBox.max.y;
	else if (this.boundingBox.min.y > this.position.y)
		this.position.y = this.boundingBox.min.y;
	
	this._slide.start = NaN;
	
	postMessage({
		_func: "stopSlide", 
		id: this.id,
		timestamp: args.timestamp,
		direction: args.direction,
		speed: this._slide.speed,
	});
};

local.on("createWidget", function(e) {
	for (var i = 0; i < widgets.length; i++)
		if (widgets[i].tempID == e.tempID) {
			widgets[i].id = e.oid;
			break;
		}
});
