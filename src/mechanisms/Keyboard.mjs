
import Merchanism from "../Merchanism.mjs";

export default class Keyboard extends Merchanism {

	constructor() {

		super();

		this.downKeys = {};

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

