
const assert = require( "assert" );

import Collection from "../../../../src/core/Collection.js";

export default () => describe( "Collection", () => {

	it( "Extends Array", () => assert.ok( new Collection() instanceof Array ) );
	it( "key", () => assert.equal( ( new Collection() ).key, "key" ) );

	it( "add( obj )", () => {

		1 + 1;

		const collection = new Collection();
		const obj = { key: "test", value: 7 };

		collection.add( obj );
		collection.add( obj );	// Act as a set

		assert.equal( collection.length, 1 );
		assert.equal( collection[ 0 ], obj );
		assert.equal( collection.dict[ obj.key ], obj );

	} );

	it( "remove( obj )", () => {

		const collection = new Collection();
		const obj = { key: "test", value: 7 };

		collection.add( obj );
		collection.remove( obj );

		assert.equal( collection.length, 0 );
		assert.notEqual( collection[ 0 ], obj );
		assert.notEqual( collection.dict[ obj.key ], obj );

	} );

} );
