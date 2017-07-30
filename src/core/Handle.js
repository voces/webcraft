
import EventDispatcher from "./EventDispatcher.js";

class Handle extends EventDispatcher {

	constructor( props ) {

		super();

		this.shadowProps = {};

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

		if ( ! proto ) return;

		return proto.constructor;

	}

	remove() {

		this.removed = true;
		this.dispatchEvent( { type: "remove", target: this } );

	}

	toState() {

		return Object.assign( {
			_key: this.key,
			_collection: this.entityType.name.toLowerCase() + "s",
			_constructor: this.constructor.name
		} );

	}

	toJSON() {

		return {
			_key: this.key,
			_collection: this.entityType.name.toLowerCase() + "s"
		};

	}

}

Handle.entityTypes = [];
Handle.id = 0;

export default Handle;
