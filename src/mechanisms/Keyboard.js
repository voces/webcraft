
import Merchanism from "../Merchanism.js";

export default class Keyboard extends Merchanism {

	keys; // A whitelist of keys to listen to; undefined means all
	downKeys = {} // Memory of which (local) keys are currently down

	constructor( { events = [ "keyDown", "keyUp" ], keys } = {} ) {

		super();

		this.keys = keys;

		// Make sure we have a window object (browser-only)
		if ( window )
			events.forEach( eventType =>
				window.addEventListener(
					eventType.toLowerCase(),
					this.keyAction( eventType ) ) );

	}

	keyAction( action ) {

		return ( { key } ) => {

			// Not in whitelist, continue
			if ( this.keys && ! this.keys.includes( key ) ) return;

			// Memorize that the key is down, only send once
			if ( action === "keyDown" ) {

				if ( this.downKeys[ key ] ) return;
				this.downKeys[ key ] = true;

				// Memorize that th ekey is up

			} else if ( action === "keyUp" )
				this.downKeys[ key ] = false;

			this.dispatchEvent( action, { key } );

		};

	}

	get attachments() {

		const attachments = {
			keyboard: this
		};

		Object.defineProperty( this, "attachments", { value: attachments } );

		return attachments;

	}

}

