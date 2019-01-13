
import EventDispatcher from "./EventDispatcher.js";

class Handle extends EventDispatcher {

	constructor( props = {} ) {

		super();

		this._props = {};

		if ( props.id === undefined && props.key === undefined )
			this.id = ( Handle.id ) ++;

	}

	get key() {

		return "h" + this.id;

	}

	set key( key ) {

		this.id = parseInt( key.slice( 1 ) );

	}

	get entityType() {

		let proto = this;

		while ( proto && Handle.entityTypes.indexOf( proto.constructor ) === - 1 )
			proto = Object.getPrototypeOf( proto );

		if ( ! proto ) throw new Error( "proto is falsey" );

		return proto.constructor;

	}

	remove() {

		this.removed = true;
		this.dispatchEvent( "remove" );

	}

	_state() {

		const obj = {};

		if ( ! Array.isArray( this.state ) ) return this.state;

		for ( let i = 0; i < this.state.length; i ++ )
			obj[ this.state[ i ] ] = this._props[ this.state[ i ] ] || this[ this.state[ i ] ];

		return obj;

	}

	toState() {

		return Object.assign( {
			key: this.key,
			_collection: this.entityType.name.toLowerCase() + "s",
			_constructor: this.constructor.name

		}, this.state ? typeof this.state === "function" ? this.state() : this._state() : null );

	}

	toJSON() {

		return {
			key: this.key,
			_collection: this.entityType.name.toLowerCase() + "s",
			_constructor: this.constructor.name
		};

	}

}

Handle.entityTypes = [ Handle ];
Handle.id = 0;

export default Handle;
