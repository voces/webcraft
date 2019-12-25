
import Merchanism from "../Merchanism.js";
import Keyboard from "./Keyboard.js";
import Mouse from "./Mouse.js";

const SCALE = 1e-2;

export default class CameraControls extends Merchanism {

	dx = 0;
	dy = 0;
	minX = - Infinity;
	minY = - Infinity;
	maxX = Infinity;
	maxY = Infinity;

	constructor( { camera, keyboard, mouse, wasd = true } ) {

		super();

		this.camera = camera;

		keyboard = keyboard || new Keyboard( {
			events: [ "keyDown", "keyUp" ],
			keys: [
				"ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", ...
				wasd ? "wasd".split( "" ) : []
			]
		} );
		mouse = mouse || new Mouse( { events: "wheel" } );

		this.attachListeners( keyboard, mouse );

	}

	attachListeners( keyboard, mouse ) {

		keyboard.addEventListener( "keyDown", ( { key } ) => {

			switch ( key ) {

				case "ArrowLeft": case "a": this.dx -= SCALE; break;
				case "ArrowRight": case "d": this.dx += SCALE; break;
				case "ArrowUp": case "w": this.dy += SCALE; break;
				case "ArrowDown": case "s": this.dy -= SCALE; break;

			}

		} );

		keyboard.addEventListener( "keyUp", ( { key } ) => {

			switch ( key ) {

				case "ArrowLeft": case "a": this.dx += SCALE; break;
				case "ArrowRight": case "d": this.dx -= SCALE; break;
				case "ArrowUp": case "w": this.dy -= SCALE; break;
				case "ArrowDown": case "s": this.dy += SCALE; break;

			}

		} );

		mouse.addEventListener( "wheel", ( { deltaY } ) => {

			this.camera.position.z += deltaY / 32;

		} );

	}

	render( delta ) {

		if ( this.dx !== 0 ) {

			const newX = Math.max( Math.min( this.camera.position.x + delta * this.dx, this.maxX ), this.minX );
			if ( this.camera.position.x !== newX ) this.camera.position.x = newX;

		}

		if ( this.dy !== 0 ) {

			const newY = Math.max( Math.min( this.camera.position.y + delta * this.dy, this.maxY ), this.minY );
			if ( this.camera.position.y !== newY ) this.camera.position.y = newY;

		}

	}

	get attachments() {

		const attachments = {
			cameraControls: this
		};

		Object.defineProperty( this, "attachments", { value: attachments } );

		return attachments;

	}

}

