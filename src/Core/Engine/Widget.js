
Engine.Widget = function(props) {
	
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
	
	//An object for sliding widgets
	this._slide = {
		start: NaN,
		startPosition: {
			x: NaN,
			y: NaN
		},
		direction: NaN,
		speed: NaN
	};
	
	applyProperties(this, props);
	
	//Let's generate the mesh
	if (this.model) {
		
		//Geometry
		if (typeof this.model.geometry == "object") {
			if (this.model.geometry.shape == "BoxGeometry") {
				
				if (this.validateProps(
					[this.model.geometry.size, "object"],
					[this.model.geometry.size.depth, "number"],
					[this.model.geometry.size.height, "number"],
					[this.model.geometry.size.width, "number"]
				))
					this.geometry = new THREE.BoxGeometry(
						this.model.geometry.size.width,
						this.model.geometry.size.height,
						this.model.geometry.size.depth);
				else
					this.geometry = new THREE.BoxGeometry(100, 100, 100);
			
			//Unknown geometry type
			} else this.geometry = new THREE.BoxGeometry(100, 100, 100);
		} else this.geometry = new THREE.BoxGeometry(100, 100, 100);
		
		//Material
		if (typeof this.model.material == "object") {
			if (this.model.material.type == "MeshLambertMaterial")
				this.material = new THREE.MeshLambertMaterial(this.model.material);
			
			//Unknown material
			else this.material = new THREE.MeshLambertMaterial({color: "green"});
		} else this.material = new THREE.MeshLambertMaterial({color: "green"});
	
	//Unknown model
	} else {
		this.geometry = new THREE.BoxGeometry(100, 100, 100);
		this.material = new THREE.MeshLambertMaterial({color: "green"});
	}
	
	this.mesh = new THREE.Mesh(this.geometry, this.material);
	
	//Fix the position
	this.mesh.position.x = (this.position.x || 0) + (this.offset.x || 0);
	this.mesh.position.y = (this.position.y || 0) + (this.offset.y || 0);
	this.mesh.position.z = (this.position.z || 0) + (this.offset.z || 0);
	
	core.graphic.scene.add(this.mesh);
};

Engine.Widget.prototype.getX = function() {
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

Engine.Widget.prototype.getY = function() {
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

Engine.Widget.prototype.getPosition = function() {
	
	//Sliding is the only movement we have, so it's easy
	if (isNaN(this._slide.start))
		return this.position;
	else {
		
		this.position.x = this._slide.startPosition.x + (Date.now() - this._slide.start)/1000 * this._slide.speed * Math.cos(this._slide.direction);
		this.position.y = this._slide.startPosition.y + (Date.now() - this._slide.start)/1000 * this._slide.speed * Math.sin(this._slide.direction);
		
		if (this.boundingBox.max.x < this.position.x)
			this.position.x = this.boundingBox.max.x;
		else if (this.boundingBox.min.x > this.position.x)
			this.position.x = this.boundingBox.min.x;
		
		if (this.boundingBox.max.y < this.position.y)
			this.position.y = this.boundingBox.max.y;
		else if (this.boundingBox.min.y > this.position.y)
			this.position.y = this.boundingBox.min.y;
		
		return this.position;
	}
};

Engine.Widget.prototype.slide = function(args) {
	
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
	
	if (core.graphic.activeMeshes.indexOf(this.mesh) < 0)
		core.graphic.activeMeshes.push(this.mesh);
};

Engine.Widget.prototype.stopSlide = function(args) {
	
	if (
		typeof args.timestamp == "undefined" ||
		isNaN(this._slide.start)
		|| this._slide.direction != args.direction
	) return;
	
	this.position.x = this._slide.startPosition.x + (args.timestamp - this._slide.start)/1000 * this._slide.speed * Math.cos(this._slide.direction);
	this.position.y = this._slide.startPosition.y + (args.timestamp - this._slide.start)/1000 * this._slide.speed * Math.sin(this._slide.direction);
	
	this._slide.start = NaN;
	
	this.mesh.position.x = this.position.x;
	this.mesh.position.y = this.position.y;
	
	core.graphic.activeMeshes.splice(core.graphic.activeMeshes.indexOf(this.mesh), 1);
};

Engine.Widget.prototype.validateProps = function() {
	for (var i = 0; i < arguments.length; i++)
		if (typeof arguments[i] == "object" && arguments[i] instanceof Array)
			if (arguments[i].length > 2)
				return typeof arguments[i][0] == arguments[i][1] && arguments[i][0] instanceof arguments[i][2];
			else return typeof arguments[i][0] == arguments[i][1];
		else return false;
};
