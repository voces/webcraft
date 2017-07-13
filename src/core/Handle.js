
import EventDispatcher from "./EventDispatcher.js";

let id = 0;

class Handle extends EventDispatcher {

	constructor( props ) {

		super();

		if ( props.id === undefined )
			this.id = id ++;

	}

	get key() {

		return "h" + this.id;

	}

	set key( value ) {

		this.id = value.slice( 1 );

	}

	get entityType() {

		let proto = this;

		while ( proto && Handle.entityTypes.indexOf( proto.constructor.name ) === - 1 )
			proto = Object.getPrototypeOf( proto );

		if ( ! proto ) return;

		return proto.constructor.name;

	}

	toState() {

		return Object.assign( {
			_key: this.key,
			_collection: this.entityType.toLowerCase() + "s",
			_constructor: this.constructor.name
		} );

	}

	toJSON() {

		return {
			_key: this.key,
			_collection: this.entityType.toLowerCase() + "s"
		};

	}

}

Handle.entityTypes = [ "Doodad", "Unit", "Player", "Rect" ];

export default Handle;
