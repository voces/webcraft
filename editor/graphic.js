
Graphic = function(element) {
	
	//Scene
	this.scene = new THREE.Scene();
	this.activeMeshes = [];
	this.keys = [];
	
	/*************************
	 **	Create the renderer
	 *************************/
	
	this.container = $('div[view_id="worldContainer"')[0];
	
	this.renderer = new THREE.WebGLRenderer({antialias:true});
	this.renderer.domElement.id = element;
	
	this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
	
	this.renderer.shadowMapEnabled = true;
	this.renderer.shadowMapSoft = true;
	
	this.renderer.shadowCameraNear = 1;
	
	this.renderer.shadowMapBias = 0.0039;
	this.renderer.shadowMapDarkness = 0.5;
	
	/*************************
	 **	Create the support objects
	 *************************/
	
	//Loads objects from JSON, including models
	this.loader = new THREE.JSONLoader();
	
	//Projector for ray casting
	//this.projector = new THREE.Projector();
	
	//this.objects = [];
	this.mouse = {
		x: 0,
		y: 0
	};
	
	/** Attach our events */
	$(document).ready(this.load.bind(this));
	$(window).resize(this.resize.bind(this));
	$(window).mousemove(this.mousemove.bind(this));
	
};

Graphic.prototype.loadBaseScene = function() {
	
	/*************************
	 **	Create the camera
	 *************************/
	
	this.camera = new THREE.PerspectiveCamera(60, this.container.clientWidth / this.container.clientHeight, 1, 10000);
	this.camera.position.z = 1792;
	
	this.scene.add(this.camera);
	
	/*************************
	 **	Create the lights
	 *************************/
	
	this.sun = new THREE.DirectionalLight(0xffffff, 1);
	this.moon = new THREE.DirectionalLight(0xffffff, .33);
	this.stars = new THREE.AmbientLight(0x111111);
	
	this.sun.position.z = 5000;
	this.moon.position.z = 5000;
	
	this.scene.add(this.sun);
	this.scene.add(this.moon);
	this.scene.add(this.stars);
	
};

/** Runs when DOM finishes loading */
Graphic.prototype.load = function() {
	
	$(this.container).append(this.renderer.domElement);
	
	this.render();
};

Graphic.prototype.render = function() {
	requestAnimationFrame(this.render.bind(this));
	
	if (!this.camera) return;
	
	//console.log('rendering');
	
	/*this.activeMeshes.forEach(function(mesh) {
		if (typeof this.marker == "undefined")
			this.marker = 0;
		else return;
		
		var position = mesh.widget.getPosition();
		
		mesh.position.x = position.x;
		mesh.position.y = position.y;
	}.bind(this));*/
	
	for (var i = 0; i < this.keys.length; i++)
		if (this.keys[i].update()) {
			this.keys.splice(i, 1);
			i--;
		}
	
	this.renderer.render(this.scene, this.camera);
};

/** Handle window resizing */
Graphic.prototype.resize = function() {
	if (!this.camera) return;
	
	this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize( this.container.clientWidth, this.container.clientHeight );
};

Graphic.prototype.mousemove = function(e) {
	if (!this.camera) return;
	
	this.mouse.x = e.clientX;
	this.mouse.y = e.clientY;
	
	/*if (this.getTopObject(e.clientX / window.innerWidth, e.clientY / window.innerHeight)) {
		//console.log('hover');
	}*/
};

/*Graphic.prototype.getTopObject = function(x, y) {
	if (!this.camera) return false;
	
	var mouse = new THREE.Vector3( ( x ) * 2 - 1, - ( y ) * 2 + 1, .5);
	var ray = this.projector.pickingRay(mouse, this.camera);
	
	var intersects = ray.intersectObjects(this.scene.children);
	
	if (intersects.length > 0)
		return intersects[0];
	else return false;
};*/

/*	This is for an ortho camera
// Handle mouse movement
Graphic.prototype.mousemove = function(e) {
	this.mouse.x = e.clientX;
	this.mouse.y = e.clientY;
	
	if (this.getTopObject(e.clientX / window.innerWidth, e.clientY / window.innerHeight)) {
		console.log('hover');
	}
};

// Returns top object, checks for UI and WORLD
Graphic.prototype.getTopObject = function(x, y) {
	var vector = new THREE.Vector3( ( x ) * 2 - 1, - ( y ) * 2 + 1, .5);
	this.projector.unprojectVector(vector, this.camera);
	
	//var ray = new THREE.Ray(this.camera.position, vector.subSelf(this.camera.position ).normalize() );
	var ray = this.projector.pickingRay(vector, this.camera);
	
	var intersects = ray.intersectObjects(this.scene.children);

	if (intersects.length > 0) {
		return intersects[0];
	} else return false;
};*/
