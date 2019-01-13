
import EventDispatcher from "../core/EventDispatcher.js";

// TODO: Remove this after #4
const eval2 = eval;

export default { load( model ) {

	this[ model ] = new EventDispatcher();

	// TODO: import()
	( () => {} )( model ).then( file => {

		const eventDispatcher = this[ model ];

		this[ model ] = eval2( file );

		eventDispatcher.dispatchEvent( "ready", { model: this[ model ] } );

	} ).catch( err => {

		throw err instanceof Error ? Error( err ) : err;

	} );

	return this[ model ];

} };
