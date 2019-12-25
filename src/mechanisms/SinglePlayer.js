
import Merchanism from "../Merchanism.js";

// A networking class for single players
export default class SinglePlayer extends Merchanism {

	_app;
	_listener;

	constructor( app ) {

		super();

		this._app = app;

		this._listener = e => {

			// Create a JSON-copy of the event. We expect similar
			// serialization/deserialization on networked communications
			e = JSON.parse( JSON.stringify( e ) );

			// Attach standard info to the event
			e.time = Date.now();
			if ( app.localPlayer ) e.player = app.localPlayer.id;
			delete e.target;

			app.dispatchEvent( e.type, e );

		};
		app.addEventListener( "transmit", this._listener );

	}

	dispose() {

		if ( this._listener )
			this._app.removeEventListener( this._listener );

		this._listener = undefined;

	}

}

