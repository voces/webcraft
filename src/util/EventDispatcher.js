
// Adapted from THREE.js

// We use a queue to ensure we operate breadth-first
let queue = [];
function process( index ) {

	const { object, type, event, args } = queue[ index ];

	// Classic-style callbacks: e.g., "leave" will invoke onLeave first
	const key = "on" + type[ 0 ].toUpperCase() + type.slice( 1 );
	if ( object[ key ] )
		object[ key ]( event, ...args );

	// Now we iterate through the actual listeners
	const arr = object._listeners[ type ];
	if ( arr !== undefined && arr.length > 0 ) {

		const clone = Array.from( arr );

		for ( let i = 0; i < clone.length; i ++ )
			clone[ i ].call( object, event, ...args );

	}

	if ( queue[ index + 1 ] ) return process( index + 1 );
	queue = [];

}

// TODO:
// Add third property, filter, which is an object literal, like { field: "x" }
// This would allow pre-processed arrays for common events (e.g., updated)
// Maybe make it optionally an array/space-delim string?
function addEventListener( type, listener ) {

	if ( typeof type === "object" && type instanceof Array )
		return type.forEach( type => this.addEventListener( type, listener ) );

	if ( type.includes( " " ) )
		return type.split( " " ).forEach( type =>
			this.addEventListener( type, listener ) );

	if ( this._listeners[ type ] === undefined )
		this._listeners[ type ] = [];

	if ( ! this._listeners[ type ].includes( listener ) )
		this._listeners[ type ].push( listener );

	return;

}

function listenOnce( type, listener ) {

	const maskedListener = ( ...args ) => {

		this.removeEventListener( type, maskedListener );
		listener( ...args );

	};

	this.addEventListener( type, maskedListener );

}

function hasEventListener( type, listener ) {

	return this._listeners[ type ] !== undefined &&
	this._listeners[ type ].includes( listener );

}

function removeEventListener( type, listener ) {

	if ( type instanceof Array )
		return type.map( type => this.removeEventListener( type, listener ) );

	if ( type.includes( " " ) )
		return type.split( " " ).map( type =>
			this.removeEventListener( type, listener ) );

	if ( this._listeners[ type ] === undefined ) return;

	const index = this._listeners[ type ].indexOf( listener );
	if ( index !== - 1 ) this._listeners[ type ].splice( index, 1 );

}

function dispatchEvent( type, event = {}, ...args ) {

	if ( ! type ) throw new Error( "Must provide a type to `dispatchEvent`" );

	if ( typeof type !== "string" )
		throw new Error( "First argument of `dispatchEvent` must be a string" );

	if ( typeof event !== "object" )
		throw new Error( "Second argument of `dispatchEvent` must be an object or undefined" );

	if ( event.target === undefined && event.constructor === Object )
		Object.defineProperty( event, "target", { value: this } );

	if ( event.type === undefined && event.constructor === Object )
		Object.defineProperty( event, "type", { value: type } );

	this._dispatches ++;
	queue.push( { object: this, type, event, args } );
	if ( queue.length === 1 ) process( 0 );

}

export const makeDispatcher = obj => {

	Object.defineProperties( obj, {
		_listeners: { value: {} },
		_dispatches: { value: 0, writable: true }
	} );

	Object.defineProperties( obj, {
		addEventListener: { value: addEventListener },
		listenOnce: { value: listenOnce },
		hasEventListener: { value: hasEventListener },
		removeEventListener: { value: removeEventListener },
		dispatchEvent: { value: dispatchEvent }
	} );

};

export default class EventDispatcher {

	constructor() {

		makeDispatcher( this );

	}

}
