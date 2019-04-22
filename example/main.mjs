
import {
	Mesh,
	MeshPhongMaterial,
	BoxBufferGeometry,
	Vector3
} from "../node_modules/three/build/three.module.js";
import Game from "../src/Game.mjs";
import Graphics from "../src/systems/Graphics.mjs";
import System from "../src/System.mjs";

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
			Math.PI * delta / 1000
		).normalize();

		object.rotateOnAxis( object.axis, Math.PI / 100 * delta / 1000 );

	}

}

class MyGame extends Game {

	constructor() {

		super();

		this.addSystem( new Graphics() );
		this.addSystem( new RotateBoxes() );
		for ( let i = 0; i < 100; i ++ )
			this.add( new Mesh( new BoxBufferGeometry(), new MeshPhongMaterial() ) );

		this.start();

	}

}

new MyGame();
