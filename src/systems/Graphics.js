
import {
	Scene,
	WebGLRenderer,
	PerspectiveCamera,
	HemisphereLight,
	DirectionalLight,
	Vector3
} from "../../node_modules/three/build/three.module.js";
import System from "../System.js";

export default class Graphics extends System {

	constructor() {

		super();
		addEventListener( "resize", () => this.updateSize() );

	}

	get attachments() {

		const attachments = {
			graphics: this,
			camera: {
				get: () => this.camera,
				set: camera => this.camera = camera
			}
		};

		Object.defineProperty( this, "attachments", { value: attachments } );

		return attachments;

	}

	dispose() {

		this.renderer.domElement.remove();

	}

	test( object ) {

		return object.isObject3D;

	}

	onAdd( object ) {

		this.scene.add( object );

	}

	get scene() {

		this.scene = new Scene();

		// Basic lighting
		this.scene.add( new HemisphereLight( 0xffffbb, 0x080820, 1 ) );

		// Sun
		const sun = new DirectionalLight( 0xffffff, 1 );
		sun.target = sun;
		const sunTilt = new Vector3( - 10, - 15, 25 );
		const updateLight = () => {

			const height = sun.position.z;
			sun.position.copy( sun.position ).add( sunTilt );
			sun.shadow.camera.near = 0;
			sun.shadow.camera.far = height * 5 + 100;
			sun.shadow.camera.left = - height * 10;
			sun.shadow.camera.right = height * 6;
			sun.shadow.camera.top = height * 10;
			sun.shadow.camera.bottom = - height * 4;
			sun.shadow.mapSize.width = 4096;
			sun.shadow.mapSize.height = 4096;

		};
		updateLight();
		sun.castShadow = true;
		this.scene.add( sun );

		return this.scene;

	}

	set scene( scene ) {

		Object.defineProperty( this, "scene", { value: scene } );
		return scene;

	}

	get camera() {

		const { width, height } = this.renderer.getSize();
		this.camera = new PerspectiveCamera( 75, width / height, 0.1, 10000 );
		this.camera.position.z = 10;
		this.camera.position.y = - 7;
		this.camera.rotation.x = 0.6;

		return this.camera;

	}

	set camera( camera ) {

		Object.defineProperty( this, "camera", { value: camera, writable: true } );
		return camera;

	}

	get renderer() {

		this.renderer = new WebGLRenderer( { antialias: true } );
		this.renderer.gammaOutput = true;
		this.renderer.setClearColor( 0x000000 );
		// this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setPixelRatio( 0.5 );
		this.renderer.shadowMap.enabled = true;
		if ( ! this.renderer.domElement.parentElement )
			document.body.appendChild( this.renderer.domElement );

		// helps with camera -> renderer -> updateSize -> camera
		( async () => this.updateSize() )();

		return this.renderer;

	}

	set renderer( renderer ) {

		Object.defineProperty( this, "renderer", { value: renderer } );
		return renderer;

	}

	updateSize() {

		const container = this.renderer.domElement.parentElement;

		this.renderer.setSize( container.offsetWidth, container.offsetHeight );

		this.camera.aspect = container.offsetWidth / container.offsetHeight;
		this.camera.updateProjectionMatrix();

		return this;

	}

	render() {

		this.renderer.render( this.scene, this.camera );

	}

}
