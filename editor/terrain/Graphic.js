
//Assumes dom ready
Graphic = function(canvas) {
	
	//Scene
	this.scene = new THREE.Scene();
	this.activeMeshes = [];
	this.keys = [];
	
	/****************************************************************************
	 **	Create the renderer
	 ****************************************************************************/
	
	this.renderer = new THREE.WebGLRenderer({
		antialias: true, canvas: canvas, alpha: true
	});
	this.canvas = this.renderer.domElement;
	this.box = canvas.parentNode;
	
	this.renderer.setSize(this.box.clientWidth, this.box.clientHeight);
	
	this.renderer.shadowMapEnabled = true;
	this.renderer.shadowMapSoft = THREE.PCFSoftShadowMap;
	
	/****************************************************************************
	 **	Create the support objects
	 ****************************************************************************/
	
	//Loads objects from JSON, including models
	this.loader = new THREE.JSONLoader();
	
	//Time tracking for light movement
	this.dayLength = 480 * 500 / Math.PI;
	this.timeDayStarted;
	this.sunDown = false;
	
	/****************************************************************************
	 **	Add events
	 ****************************************************************************/
	
	//Attach our events
	window.addEventListener('resize', this.resize.bind(this));
	
	/****************************************************************************
	 **	And we're ready!
	 ****************************************************************************/
	
	//And load the base scene (camera & lights) & render
	this.loadBaseScene();
	this.render();
	
};

Graphic.prototype.loadBaseScene = function() {
	
	/****************************************************************************
	 **	Create the camera
	 ****************************************************************************/
	
	this.camera = new THREE.PerspectiveCamera(60,
			(this.canvas.clientWidth - 257) / this.canvas.clientHeight,
			1, 10000);
	
	this.camera.position.z = 1792;
	this.camera.position.y = -1024;
	this.camera.rotation.x = Math.PI * 17/90;
	
	this.scene.add(this.camera);
	
	/****************************************************************************
	 **	Create the secondary camera (preview)
	 ****************************************************************************/
	
	this.previewCamera = new THREE.PerspectiveCamera(60, 1, 1, 10000);
	
	this.previewCamera.position.z = 1792;
	
	this.scene.add(this.previewCamera);
	
	/****************************************************************************
	 **	Create the lights
	 ****************************************************************************/
	
	//Sun
	
	this.sun = new THREE.DirectionalLight(0xffffff, 0.80);
	
	this.sun.castShadow = true;
	//this.sun.shadowCameraVisible = true;
	this.sun.shadowMapWidth = 4096;
	this.sun.shadowMapHeight = 4096;

	var d = 1024;

	this.sun.shadowCameraLeft = -d;
	this.sun.shadowCameraRight = d;
	this.sun.shadowCameraTop = d;
	this.sun.shadowCameraBottom = -d;

	this.sun.shadowCameraFar = 7000;
	this.sun.shadowDarkness = .64;
	
	this.scene.add(this.sun);
	
	//Moon & stars
	
	this.moon = new THREE.DirectionalLight(0xeeeeff, 0.30);
	
	this.scene.add(this.moon);
	
	this.stars = new THREE.AmbientLight(0x9A9A9A);
	this.scene.add(this.stars);
	
	//Fog
	
	//this.fog = new THREE.FogExp2(0xcceeff);
	this.scene.fog = new THREE.FogExp2(0xcceeff, 0.00015);
	
	/****************************************************************************
	 **	And we're basically done!
	 ****************************************************************************/
	
	this.timeDayStarted = Date.now();
	
};

Graphic.prototype.animateLights = function(elapsed) {
	
	//Get the point in the day (0 is noon, PI is midnight, 2PI = 0)
	var dayTime = elapsed/this.dayLength;
	
	//Adjust the sun
	this.sun.position.x = Math.sin(dayTime) * 5000;
	this.sun.position.y = Math.cos(dayTime) * 4000;
	this.sun.position.z = Math.cos(dayTime) * 3000 + 2000;
	
	//Adjust shadows
	this.sun.shadowDarkness = 0.64 * Math.sin(this.sun.position.z / 5000);
	
	//sun is setting...
	if (this.sun.position.z < 2000 && this.sun.position.z > 0) {
		
		//Adjust color of sun (red/orange shift near sun set/rise)
		this.sun.color.r = Math.sin(this.sun.position.z/2000/2*Math.PI);
		this.sun.color.g = Math.pow(Math.sin(this.sun.position.z/2000/2*Math.PI),
				1.75);
		this.sun.color.b = Math.pow(Math.sin(this.sun.position.z/2000/2*Math.PI),
				3);
		
		//Make stars somewhat match (i.e., stars + simple sun reflections)
		this.stars.color.r = this.sun.color.r * 0.4 + 0.1;
		this.stars.color.g = this.sun.color.g * 0.4 + 0.1;
		this.stars.color.b = this.sun.color.b * 0.4 + 0.1;
		
		//Only change shadows once (IDK if it's expensive otherwise) on sunrise
		if (this.sunDown) {
			this.sunDown = false;
			this.sun.castShadow = true;
		}
	
	//Sun just set, turn off shadows (weird shit happens otherwise)
	} else if (this.sun.position.z < 0 && !this.sunDown) {
		this.sun.castShadow = false;
		this.sunDown = true;
	}
	
	//Adjust moon position
	this.moon.position.x = Math.sin(dayTime/1.0366 + Math.PI) * 5000;
	this.moon.position.y = Math.cos(dayTime/1.0366 + Math.PI) * -4000;
	this.moon.position.z = Math.cos(dayTime/1.0366 + Math.PI) * 5000;
	
	//Dim moon when it sets (so it doesn't light from the bottom)
	if (this.moon.position.z < 2000 && this.moon.position.z > 0)
		this.moon.intensity =
				Math.sin((this.moon.position.z/2000)/2*Math.PI) * 0.30;
	
	//These points are just illustrative to show where the sun/moon are
	
	/*if (!this.sunPoint) {
		this.sunPoint = new Point(16, 0xffff00);
		this.scene.add(this.sunPoint);
	}
	
	this.sunPoint.position.x = this.sun.position.x / 10;
	this.sunPoint.position.y = this.sun.position.y / 10;
	this.sunPoint.position.z = this.sun.position.z / 10;
	
	if (!this.moonPoint) {
		this.moonPoint = new Point(8, 0xdddddd);
		this.scene.add(this.moonPoint);
	}
	
	this.moonPoint.position.x = this.moon.position.x / 10;
	this.moonPoint.position.y = this.moon.position.y / 10;
	this.moonPoint.position.z = this.moon.position.z / 10;*/
	
};

Graphic.prototype.render = function() {
	requestAnimationFrame(this.render.bind(this));
	
	if (!this.camera) return;
	
	var elapsed = this.timeDayStarted - Date.now();
	
	this.animateLights(elapsed);
	
	for (var i = 0; i < this.keys.length; i++)
		if (this.keys[i].update()) {
			this.keys.splice(i, 1);
			i--;
		}
	
	//Render the main display first
	
	//Only render it if part of it is visible, otherwise errors
	if (this.canvas.clientWidth >= 257) {
		
		if (isNaN(this.camera.position.x)) this.camera.position.x = 0;
		if (isNaN(this.camera.position.y)) this.camera.position.y = 0;
		if (isNaN(this.camera.position.z)) this.camera.position.z = 0;
		
		this.renderer.setViewport(257, 0,
				this.canvas.clientWidth - 257, this.canvas.clientHeight);
		this.renderer.setScissor(257, 0,
				this.canvas.clientWidth - 257, this.canvas.clientHeight);
		
		//Must disable scissor test for shadows to work (yay bugs!)
		
		this.renderer.enableScissorTest(false);
		
		this.renderer.render(this.scene, this.camera);
		
		this.renderer.enableScissorTest(true);
		
		
	}
	
	//Then render the preview
	
	this.renderer.setViewport(0, this.canvas.clientHeight - 256, 256, 256);
	this.renderer.setScissor(0, this.canvas.clientHeight - 256, 256, 256);
	
	this.renderer.enableScissorTest(true);
	
	this.renderer.render(this.scene, this.previewCamera);
	
};

/** Handle window resizing */
Graphic.prototype.resize = function() {
	if (!this.camera) return;
	
	this.renderer.setSize(this.box.clientWidth,
			this.box.clientHeight);
	
	this.camera.aspect = (this.canvas.clientWidth - 257) /
			this.canvas.clientHeight;
	
	this.camera.updateProjectionMatrix();
	
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
	
	if (this.getTopObject(e.clientX / window.innerWidth,
			e.clientY / window.innerHeight)) {
		console.log('hover');
	}
};

// Returns top object, checks for UI and WORLD
Graphic.prototype.getTopObject = function(x, y) {
	var vector = new THREE.Vector3( ( x ) * 2 - 1, - ( y ) * 2 + 1, .5);
	this.projector.unprojectVector(vector, this.camera);
	
	//var ray = new THREE.Ray(this.camera.position,
	//		vector.subSelf(this.camera.position ).normalize() );
	var ray = this.projector.pickingRay(vector, this.camera);
	
	var intersects = ray.intersectObjects(this.scene.children);

	if (intersects.length > 0) {
		return intersects[0];
	} else return false;
};*/
