
import System from "../System.js";

export default ( collection, test ) => new class extends System {

	get attachments() {

		const attachments = {
			[ collection ]: this
		};

		Object.defineProperty( this, "attachments", { value: attachments } );

		return attachments;

	}

	test( object ) {

		if ( test )
			if ( typeof test === "function" ) return test( object );
			else return object[ test ];

		return object[ collection ];

	}

}();

