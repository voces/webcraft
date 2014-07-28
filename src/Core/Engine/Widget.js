
Engine.Widget = function(props) {
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
	
	//Some other stuff..
	this._slide = {
		start: NaN,
		startPosition: {
			x: NaN,
			y: NaN
		},
		direction: NaN,
		speed: NaN
	};
	
	this.boundingBox = {
		max: {
			x: NaN,
			y: NaN
		},
		min: {
			x: NaN,
			y: NaN
		}
	}
	
	core.graphic.scene.add(this.mesh);
};

Engine.Widget.prototype.getX = function() {
	if (this._slide.start == NaN)
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
	if (this._slide.start == NaN)
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
		/*console.log(this.position);
		console.log("this._slide.startPosition", this._slide.startPosition);
		console.log("Date.now() - this._slide.start", Date.now() - this._slide.start);
		console.log("this._slide.speed", this._slide.speed);
		console.log("this._slide.direction", this._slide.direction);*/
		
		/*console.log(this._slide.startPosition.y, "+", Date.now(), "-", this._slide.start, "*", this._slide.speed, "* Math.sin(", this._slide.direction, ")");
		console.log(this._slide.startPosition.y, "+", (Date.now() - this._slide.start)/1000, "*", this._slide.speed, "*", Math.sin(this._slide.direction));
		console.log(this._slide.startPosition.y, "+", (Date.now() - this._slide.start)/1000 * this._slide.speed, "*", Math.sin(this._slide.direction));
		console.log(this._slide.startPosition.y, "+", (Date.now() - this._slide.start)/1000 * this._slide.speed * Math.sin(this._slide.direction));
		console.log(this._slide.startPosition.y + (Date.now() - this._slide.start)/1000 * this._slide.speed * Math.sin(this._slide.direction));*/
		
		this.position.x = this._slide.startPosition.x + (Date.now() - this._slide.start)/1000 * this._slide.speed * Math.cos(this._slide.direction);
		this.position.y = this._slide.startPosition.y + (Date.now() - this._slide.start)/1000 * this._slide.speed * Math.sin(this._slide.direction);
		//console.log(this.position);
		if (this.boundingBox.max.x < this.position.x)
			this.position.x = this.boundingBox.max.x;
		else if (this.boundingBox.min.x > this.position.x)
			this.position.x = this.boundingBox.min.x;
		//console.log(this.position);
		if (this.boundingBox.max.y < this.position.y)
			this.position.y = this.boundingBox.max.y;
		else if (this.boundingBox.min.y > this.position.y)
			this.position.y = this.boundingBox.min.y;
		//console.log(this.position);
		return this.position;
	}
};

Engine.Widget.prototype.slide = function(args) {
	//console.log("slide a", startPosition);
	var startPosition = this.getPosition();
	//console.log("slide b", startPosition);
	
	applyProperties(this._slide, {
		start: args.timestamp,
		startPosition: startPosition,
		direction: args.direction,
		speed: args.speed || this.speed
	});
	
	core.graphic.activeMeshes.push(this.mesh);
};

Engine.Widget.prototype.stopSlide = function(args) {
	var startPosition = this.getPosition();
	
	this.position.x = this._slide.startPosition.x + (args.timestamp - this._slide.start)/1000 * this._slide.speed * Math.cos(this._slide.direction);
	this.position.y = this._slide.startPosition.y + (args.timestamp - this._slide.start)/1000 * this._slide.speed * Math.sin(this._slide.direction);
	
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
