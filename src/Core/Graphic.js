Graphic = function(element) {
	
	//Scene
	this.scene = new THREE.Scene();
	
	/*************************
	 **	Create the renderer
	 *************************/
	
	this.renderer = new THREE.WebGLRenderer({antialias:true});
	this.renderer.domElement.id = element;
	
	this.renderer.setSize(window.innerWidth, window.innerHeight);
	
	this.renderer.shadowMapEnabled = true;
	this.renderer.shadowMapSoft = true;
	
	this.renderer.shadowCameraNear = 1;
	//this.renderer.shadowCameraFar = this.camera.far;
	//this.renderer.shadowCameraFov = this.camera.fov;
	
	this.renderer.shadowMapBias = 0.0039;
	this.renderer.shadowMapDarkness = 0.5;
	//this.renderer.shadowMapWidth = 1024;
	//this.renderer.shadowMapHeight = 1024;
	
	//this.scene.add(this.renderer);
	
	/*************************
	 **	Create the camera
	 *************************/
	
	this.distance = 72;
	this.camera = new THREE.OrthographicCamera(
			window.innerWidth / -this.distance,
			window.innerWidth / this.distance,
			window.innerHeight / this.distance,
			window.innerHeight / -this.distance,
			.01,
			100000
	);
	/*this.camera.left = window.innerWidth / - this.distance;
	this.camera.right = window.innerWidth / this.distance;
	this.camera.top = window.innerHeight / this.distance;
	this.camera.bottom = window.innerHeight / - this.distance;*/
	//this.camera.position.z = 10;
	//this.camera.updateProjectionMatrix();
	this.scene.add(this.camera);
	
	//camera: new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000),
	
	/*************************
	 **	Create the lights
	 *************************/
	
	this.sun = new THREE.DirectionalLight(0xffffff, 1);	//Lights up UI, nothing else?
	this.moon = new THREE.DirectionalLight(0xffffff, .33);	//Lights up UI, nothing else?
	this.stars = new THREE.AmbientLight(0x111111);	//Lights up UI, nothing else?
	
	this.sun.position.z = 100;
	this.moon.position.z = 100;
	
	this.scene.add(this.sun);
	this.scene.add(this.moon);
	this.scene.add(this.stars);
	
	//Create the fog
	this.scene.fog = new THREE.FogExp2(0x000000, 0.0001);
	
	//this.light.position.z = 5000;
	/*this.light.shadowCameraLeft = -500;
	this.light.shadowCameraRight = 500;
	this.light.shadowCameraTop = 500;
	this.light.shadowCameraBottom = -500;*/
	
	//this.light.castShadow = true;
	//this.light.shadowDarkness = .75;
	//this.light.shadowCameraVisible = true;
	
	/*this.sun.castShadow = true;
	this.sun.shadowDarkness = 1;
	this.sun.shadowCameraRight = this.camera.right;
	this.sun.shadowCameraLeft = this.camera.left;
	this.sun.shadowCameraTop = this.camera.top;
	this.sun.shadowCameraBottom = this.camera.bottom;
	
	this.moon.castShadow = true;
	this.moon.shadowDarkness = 1;
	this.moon.shadowCameraRight = this.camera.right;
	this.moon.shadowCameraLeft = this.camera.left;
	this.moon.shadowCameraTop = this.camera.top;
	this.moon.shadowCameraBottom = this.camera.bottom;*/
	
	/*************************
	 **	Create the support objects
	 *************************/
	
	//Loads objects from JSON, including models
	this.loader = new THREE.JSONLoader();
	
	//Projector for ray casting
	this.projector = new THREE.Projector();
	
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

/** Runs when DOM finishes loading */
Graphic.prototype.load = function() {
	$("body").append(this.renderer.domElement);
	this.render();
},

Graphic.prototype.render = function() {
	requestAnimationFrame(this.render.bind(this));
	
	var now = Date.now();
	
	/*e.units.forEach(function(v) {
		if (v instanceof DynamicVariable) {
			v2 = get(now, v);
			while (v2 instanceof DynamicVariable) v2 = get(now, v2);
			if (v2 instanceof Unit) {
				var x = get(now, v2.x);
				var y = get(now, v2.y);
				
				if (v2.mesh.position.x != x) v2.mesh.position.x = x;
				if (v2.mesh.position.y != y) v2.mesh.position.y = y;
			}
		}
	});*/
	
	/*e.objects.forEach(function(v) {
		v2 = v;
		while (v2 instanceof DynamicVariable) v2 = get(now, v2);
		if (v2 instanceof Unit && v2.flagGraphicUpdate) {
			v2.mesh.position.x = get(now, v2.x);
			v2.mesh.position.y = get(now, v2.y);
			v2.flagGraphicUpdate = false;
		}
	});*/
	
	
	this.renderer.render(this.scene, this.camera);
},

/** Handle window resizing */
Graphic.prototype.resize = function() {
	this.renderer.setSize(window.innerWidth, window.innerHeight);
	
	this.camera.left = window.innerWidth / - this.distance;
	this.camera.right = window.innerWidth / this.distance;
	this.camera.top = window.innerHeight / this.distance;
	this.camera.bottom = window.innerHeight / - this.distance;
	
	this.camera.updateProjectionMatrix();
	
	//camera.aspect = window.innerWidth / window.innerHeight;
	//camera.updateProjectionMatrix();
},

/** Handle mouse movement */
Graphic.prototype.mousemove = function(e) {
	this.mouse.x = e.clientX;
	this.mouse.y = e.clientY;
	
	if (this.getTopObject(e.clientX / window.innerWidth, e.clientY / window.innerHeight)) {
		console.log('hover');
	}
},

/** Returns top object, checks for UI and WORLD */
Graphic.prototype.getTopObject = function(x, y) {
	var vector = new THREE.Vector3( ( x ) * 2 - 1, - ( y ) * 2 + 1, .5);
	this.projector.unprojectVector(vector, this.camera);
	
	//var ray = new THREE.Ray(this.camera.position, vector.subSelf(this.camera.position ).normalize() );
	var ray = this.projector.pickingRay(vector, this.camera);
	
	var intersects = ray.intersectObjects(this.scene.children);

	if (intersects.length > 0) {
		return intersects[0];
	} else return false;
},

Graphic.prototype.generateBackground = function() {
	// create the particle variables
	var particleCount = 512,
		particles = new THREE.Geometry(),
		pMaterial = new THREE.ParticleBasicMaterial({
			color: 0xFFFFFF,
			size: .5,
			map: THREE.ImageUtils.loadTexture(
				"img/smoke.png"
			),
			transparent: true,
		});
	
	var m = 4;
	
	// now create the individual particles
	for (var p = 0; p < particleCount; p++) {

		// create a particle with random
		// position values, -250 -> 250
		var pX = Math.random() * 16*m - 8*m,
			pY = Math.random() * 9*m - 4.5*m,
			pZ = Math.random() * 90 - 100,
			particle = new THREE.Vector3(pX, pY, pZ);
		
		particle.velocity = new THREE.Vector3(Math.random()-.5, -Math.random()*2-.1, Math.random()-.5);
		particle.velocity.multiplyScalar(.25/m);
		
		// add it to the geometry
		particles.vertices.push(particle);
	}

	// create the particle system
	var particleSystem = new THREE.ParticleSystem(particles, pMaterial);
	particleSystem.sortParticles = true;
	
	// add it to the scene
	this.scene.add(particleSystem);
	
	var interval = setInterval(function() {
		if (typeof particleSystem.parent == 'undefined') clearInterval(interval);
		else {
			var t = particleCount;
			
			while (t--) {
				var particle = particles.vertices[t];
				
				if (particle.y < -4.5*m)
					particle.y = 4.5*m;
				else if (particle.x < -8*m)
					particle.x = 8*m;
				else if (particle.x > 8*m)
					particle.x = -8*m;
				else if (particle.z < -100) {
					particle.z = 0;
					particle.y = 4.5*m;
				} else if (particle.z > 0)
					particle.z = -100;
				else
					particle.addSelf(particle.velocity);
			}
		}
		particleSystem.geometry.__dirtyVertices = true;
	}.bind(this), 32);	//
}
