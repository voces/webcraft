
Engine.Widget = function(props) {
	applyProperties(this, props);
	
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
			else this.material = new THREE.MeshLambertMaterial({color: "green"});
		} else this.material = new THREE.MeshLambertMaterial({color: "green"});
	
	//Unknown model
	} else {
		this.geometry = new THREE.BoxGeometry(100, 100, 100);
		this.material = new THREE.MeshLambertMaterial({color: "green"});
	}
	
	this.mesh = new THREE.Mesh(this.geometry, this.material);
	this.mesh.position.x = (this.position.x || 0) + (this.offset.x || 0);
	this.mesh.position.y = (this.position.y || 0) + (this.offset.y || 0);
	this.mesh.position.z = (this.position.z || 0) + (this.offset.z || 0);
	
	core.graphic.scene.add(this.mesh);
};

Engine.Widget.prototype.missingGeoemtry = function() {
	
};

Engine.Widget.prototype.validateProps = function() {
	for (var i = 0; i < arguments.length; i++)
		if (typeof arguments[i] == "object" && arguments[i] instanceof Array)
			if (arguments[i].length > 2)
				return typeof arguments[i][0] == arguments[i][1] && arguments[i][0] instanceof arguments[i][2];
			else return typeof arguments[i][0] == arguments[i][1];
		else return false;
};
