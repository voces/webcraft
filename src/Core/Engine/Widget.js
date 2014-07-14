Widget = function(timestamp, type, player, x, y) {
	while (x instanceof DynamicVariable) x = x.get(timestamp);
	while (y instanceof DynamicVariable) y = y.get(timestamp);
	
	this.type = type;
	this.player = player;
	this.x = x;
	this.y = y;
	this.flagGraphicUpdate = false;
	this.ignoreCollisons = [];
	
	if (this.type.geometry.shape == "Sphere") this.mesh = new THREE.Mesh(new THREE.SphereGeometry(this.type.geometry.size/2, this.type.geometry.widthSeg, this.type.geometry.heightSeg), new THREE.MeshPhongMaterial());
	if (this.type.geometry.shape == "Cube") this.mesh = new THREE.Mesh(new THREE.CubeGeometry(this.type.geometry.size, this.type.geometry.size, this.type.geometry.size), new THREE.MeshPhongMaterial());
	
	this.mesh.position.x = get(timestamp, this.x);
	this.mesh.position.y = get(timestamp, this.y);
	this.mesh.position.z = this.type.geometry.size/2;
	
	e.units.push(new DynamicVariable(this, timestamp));
	
	g.w.scene.add(this.mesh);
}

Unit.prototype.toString = function() {
	return this.type.name;
}