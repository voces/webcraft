
// Adapted from THREE.js

class EventDispatcher {

	constructor() {

		Object.defineProperties( this, {
			_listeners: { value: {} }
		} );

	}

	get _listenerCount() {

		let count = 0;

		for ( const prop in this._listeners )
			count += this._listeners[ prop ].length;

		return count;

	}

	addEventListener( type, listener ) {

		const listeners = this._listeners;

		if ( listeners[ type ] === undefined )
			listeners[ type ] = [];

		if ( listeners[ type ].indexOf( listener ) === - 1 )
			listeners[ type ].push( listener );

	}

	hasEventListener( type, listener ) {

		const listeners = this._listeners;

		return listeners[ type ] !== undefined && listeners[ type ].indexOf( listener ) !== - 1;

	}

	removeEventListener( type, listener ) {

		const listenerArray = this._listeners[ type ];

		if ( listenerArray !== undefined ) {

			const index = listenerArray.indexOf( listener );
			if ( index !== - 1 ) listenerArray.splice( index, 1 );

		}

	}

	dispatchEvent( event ) {

		const listenerArray = this._listeners[ event.type ];

		if ( listenerArray !== undefined ) {

			// event.target = this;

			const array = [],
				length = listenerArray.length;

			for ( let i = 0; i < length; i ++ )
				array[ i ] = listenerArray[ i ];

			for ( let i = 0; i < length; i ++ )
				array[ i ].call( this, event );

		}

	}

}

export default EventDispatcher;
