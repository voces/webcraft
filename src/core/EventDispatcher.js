
// Adapted from THREE.js

import * as env from "../misc/env.js";

class EventDispatcher {

	get _listenerCount() {

		let count = 0;

		for ( const prop in this._listeners )
			count += this._listeners[ prop ].length;

		return count;

	}

	addEventListener( type, listener ) {

		if ( this._listeners === undefined ) this._listeners = {};

		if ( this._listeners[ type ] === undefined )
			this._listeners[ type ] = [];

		if ( this._listeners[ type ].indexOf( listener ) === - 1 )
			this._listeners[ type ].push( listener );

	}

	hasEventListener( type, listener ) {

		if ( this._listeners === undefined ) return;

		return this._listeners[ type ] !== undefined && this._listeners[ type ].indexOf( listener ) !== - 1;

	}

	removeEventListener( type, listener ) {

		if ( this._listeners === undefined ) return;

		if ( this._listeners[ type ] === undefined ) return;

		const index = this._listeners[ type ].indexOf( listener );
		if ( index !== - 1 ) this._listeners[ type ].splice( index, 1 );

	}

	dispatchEvent( event, received ) {

		if ( this._listeners === undefined ) return;

		const arr = this._listeners[ event.type ];
		if ( arr === undefined || arr.length === 0 ) return;

		if ( env.isClient && ! received )
			event.type = event.type + "Prediction";

		const clone = arr.slice( 0 );

		for ( let i = 0; i < clone.length; i ++ )
			try {

				clone[ i ].call( this, event );

			} catch ( err ) {

				// Report user errors but continue on
				console.error( err );

			}

	}

}

export default EventDispatcher;
