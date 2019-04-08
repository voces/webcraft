
import { commonConstructor } from "../util.mjs/index.mjs";

export default class Keyboard {

	constructor( { app, keys, events = [ "keyDown", "keyUp" ] } ) {

		this.app = app;
		this.keys = keys;
		this.events = events;
		this.downKeys = {};

		commonConstructor( this );

	}

	initBrowser() {

		this.events.forEach( eventType =>
			window.addEventListener(
				eventType.toLowerCase(),
				this.keyAction( eventType ) ) );

	}

	keyAction( action ) {

		return ( { key } ) => {

			if ( this.keys && ! this.keys.includes( key ) ) return;

			if ( action === "keyDown" ) {

				if ( this.downKeys[ key ] ) return;
				this.downKeys[ key ] = true;

			} else if ( action === "keyUp" )
				this.downKeys[ key ] = false;

			this.app.transmit( action, { key } );

		};

	}

}
