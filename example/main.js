
import {
	Mesh,
	MeshPhongMaterial,
	BoxBufferGeometry,
	Vector3
} from "../node_modules/three/build/three.module.js";
import Game from "../src/Game.js";
import Graphics from "../src/systems/Graphics.js";
import Mouse from "../src/mechanisms/Mouse.js";
import CameraControls from "../src/mechanisms/CameraControls.js";
import SinglePlayer from "../src/mechanisms/SinglePlayer.js";
import System from "../src/System.js";

class RotateBoxes extends System {

	test( object ) {

		return object instanceof Mesh && object.geometry instanceof BoxBufferGeometry;

	}

	onAdd( object ) {

		if ( object.axis === undefined )
			object.axis = new Vector3(
				Math.PI * 2 * Math.random(),
				Math.PI * 2 * Math.random(),
				Math.PI * 2 * Math.random()
			).normalize();

		if ( object.axisAcceleration === undefined )
			object.axisAcceleration = new Vector3(
				Math.PI * 2 * Math.random(),
				Math.PI * 2 * Math.random(),
				Math.PI * 2 * Math.random()
			).normalize();

	}

	render( object, delta ) {

		object.axis.applyAxisAngle(
			object.axisAcceleration,
			Math.PI * delta / 100
		).normalize();

		object.rotateOnAxis( object.axis, Math.PI / 100 * delta / 100 );

	}

}

class MyGame extends Game {

	constructor() {

		super();

		this.addSystem( new Graphics() );
		this.addSystem( new RotateBoxes() );
		this.addMechanism( new Mouse() );
		this.addMechanism( new CameraControls( {
			camera: this.camera
		} ) );

		const material = new MeshPhongMaterial();
		for ( let i = 0; i < 10; i ++ ) {

			const mesh = new Mesh( new BoxBufferGeometry(), material );
			mesh.position.x += ( Math.random() - 0.5 ) * 20;
			mesh.position.y += ( Math.random() - 0.5 ) * 20;
			this.add( mesh );

		}

		this.addMechanism( new SinglePlayer( this ) );

		this.start();

	}

}

new MyGame();
