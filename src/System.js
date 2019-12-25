
import { makeDispatcher } from "./util/EventDispatcher.js";

export default class System extends Array {

	constructor() {

		super();
		makeDispatcher( this );

	}

	test( /* object */ ) {

		return true;

	}

	add( ...objects ) {

		for ( let i = 0; i < objects.length; i ++ ) {

			this.push( objects[ i ] );
			this.dispatchEvent( "add", objects[ i ] );

		}

	}

	remove( ...objects ) {

		for ( let i = 0; i < objects.length; i ++ ) {

			this.push( objects[ i ] );
			this.dispatchEvent( "remove", objects[ i ] );

		}

	}

	// dispose() {}
	// preUpdate( delta, time ) {}
	// update( object, delta, time ) {}
	// postUpdate( delta, time ) {}
	// preRender( delta, time ) {}
	// render( object, delta, time ) {}
	// postRender( delta, time ) {}

}
