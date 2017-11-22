
/* globals describe it */

const assert = require( "assert" );

import EventDispatcher from "../../../../src/core/EventDispatcher.js";
import Handle from "../../../../src/core/Handle.js";

export default () => describe( "Handle", () => {

	it( "Extends EventDispatcher", () => assert.ok( new Handle() instanceof EventDispatcher ) );
	it( "Automatic id", () => assert.equal( typeof new Handle().id, "number" ) );
	it( "Automatic key", () => {

		const handle = new Handle();

		assert.equal( typeof handle.key, "string" );
		assert.ok( handle.key.startsWith( "h" ) );
		assert.equal( parseInt( handle.key.slice( 1 ) ), handle.id );

	} );

	it( "toState()", () => {

		const handle = new Handle();
		const baseState = { key: handle.key, _collection: "handles", _constructor: "Handle" };

		assert.deepEqual( handle.toState(), baseState );

		Object.assign( handle, { state: [ "a", "b", "c" ], a: 7357, b: "test" } );
		assert.deepEqual( handle.toState(), Object.assign( { a: 7357, b: "test", c: undefined }, baseState ) );

		handle.state = { d: 7357, e: "test", f: undefined };
		assert.deepEqual( handle.toState(), Object.assign( { d: 7357, e: "test", f: undefined }, baseState ) );

		handle.state = () => ( { g: 7357, h: "test", i: undefined } );
		assert.deepEqual( handle.toState(), Object.assign( { g: 7357, h: "test", i: undefined }, baseState ) );

	} );

	it( "toJSON()", () => {

		const handle = new Handle();

		assert.deepEqual( handle.toState(), { key: handle.key, _collection: "handles", _constructor: "Handle" } );

	} );

	it( "remove()", function ( done ) {

		this.timeout( 10 );

		const handle = new Handle();

		handle.addEventListener( "remove", () => done() );

		handle.remove();

		assert.ok( handle.removed );

	} );

} );
