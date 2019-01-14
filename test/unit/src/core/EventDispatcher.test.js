
import assert from "assert";

import EventDispatcher from "../../../../src/core/EventDispatcher.js";

export default () => describe( "EventDispatcher", function () {

	this.timeout( 10 );

	describe( "#addEventListener", () => {

		it( "one type", () => {

			const ed = new EventDispatcher();
			const listener = () => {};
			ed.addEventListener( "test", listener );

			assert.equal( ed._listeners.test[ 0 ], listener, "Callback not added" );

		} );

		it( "space-delimited types", () => {

			const ed = new EventDispatcher();
			const listener = () => {};
			ed.addEventListener( "test1 test2", listener );

			assert.equal( ed._listeners.test1[ 0 ], listener, "Callback not added" );
			assert.equal( ed._listeners.test2[ 0 ], listener, "Callback not added" );

		} );

		it( "array types", () => {

			const ed = new EventDispatcher();
			const listener = () => {};
			ed.addEventListener( [ "test3", "test4" ], listener );

			assert.equal( ed._listeners.test3[ 0 ], listener, "Callback not added" );
			assert.equal( ed._listeners.test4[ 0 ], listener, "Callback not added" );

		} );

	} );

	it( "#hasEventListener", () => {

		const ed = new EventDispatcher();
		const listener = () => {};
		assert.ok( ! ed.hasEventListener( "test", listener ), "Listener found before adding" );

		ed.addEventListener( "test", listener );
		assert.ok( ed.hasEventListener( "test", listener ), "Listener not found" );
		assert.ok( ! ed.hasEventListener( "test2", listener ), "Another listener found" );

	} );

	it( "#removeEventListener", () => {

		const ed = new EventDispatcher();
		const listener = () => {};
		ed.addEventListener( "test", listener );
		ed.removeEventListener( "test", listener );

		assert.ok( ! ed.hasEventListener( "test", listener ), "Listener found after removing" );

	} );

	describe( "#dispatchEvent", () => {

		it( "works", done => {

			const ed = new EventDispatcher();
			ed.addEventListener( "test", () => done() );

			ed.dispatchEvent( "test" );

		} );

		it( "sub-events are processed after all callbacks", done => {

			const ed = new EventDispatcher();
			let invoked = false;
			ed.addEventListener( "test", () => ed.dispatchEvent( "test2" ) );
			ed.addEventListener( "test", () => invoked = true );
			ed.addEventListener( "test2", () => {

				assert.ok( invoked ),
				done();

			} );

			ed.dispatchEvent( "test" );

		} );

	} );

} );
