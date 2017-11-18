
// Adapted from THREE.js

// import * as env from "../misc/env.js";

class EventDispatcher {

	get _listenerCount() {

		let count = 0;

		for ( const prop in this._listeners )
			count += this._listeners[ prop ].length;

		return count;

	}

	addEventListener( types, listener ) {

		if ( types.indexOf( " " ) !== - 1 ) types.split( " " ).map( type => this.addEventListener( type, listener ) );

		if ( this._listeners === undefined ) this._listeners = {};

		if ( this._listeners[ types ] === undefined )
			this._listeners[ types ] = [];

		if ( this._listeners[ types ].indexOf( listener ) === - 1 )
			this._listeners[ types ].push( listener );

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

	dispatchEvent( type, event, ...args ) {

		if ( ! type ) return;

		if ( typeof type !== "string" ) {

			args.unshift( event );
			event = type;
			type = type.type;

		}

		if ( typeof event === "object" ) event.target = this;
		else if ( event === undefined ) event = { target: this };

		let target = this;
		let stopPropagation = false;

		while ( target && ! stopPropagation ) {

			if ( typeof event === "object" ) event.currentTarget = target;

			if ( target._listeners === undefined ) return;

			const arr = target._listeners[ type ];
			if ( arr === undefined || arr.length === 0 ) return;

			const clone = arr.slice( 0 );

			for ( let i = 0; i < clone.length && ! stopPropagation; i ++ )
				stopPropagation = clone[ i ].call( target, event, ...args ) === false;

			target = target.parent;

		}

	}

}

export default EventDispatcher;
