
import assert from "assert";
import Pathing from "../../../src/systems/Pathing";
import Doodad from "../../../src/entities/Doodad.js";

const assertSameElements = ( actual, expected ) =>
	assert.deepStrictEqual(
		actual.map( i => i.id ).sort( ( a, b ) => b - a ),
		expected.map( i => i.id ).sort( ( a, b ) => b - a )
	);

describe( "Pathing", () => {

	let pathing;
	beforeEach( () => pathing = new Pathing() );

	describe( "#app", () => {

		let app;
		beforeEach( () => {

			app = {};
			pathing.app = app;

		} );

		it( "sets pathing on app", () =>
			assert.equal( app.pathing, pathing ) );

		it( "clears pathing on old app", () => {

			pathing.app = undefined;
			assert.equal( app.pathing, undefined );

		} );

	} );

	describe( "#test", () => {

		it( "rejects undefined", () => {

			assert.equal( pathing.test( {} ), false );
			assert.equal( pathing.test( { x: 0 } ), false );
			assert.equal( pathing.test( { y: 0 } ), false );

		} );

		it( "rejects incorrect types", () => {

			assert.equal( pathing.test( { x: "abc", y: "abc" } ), false );
			assert.equal( pathing.test( { x: "abc", y: 0 } ), false );
			assert.equal( pathing.test( { x: 0, y: "abc" } ), false );

		} );

		it( "accepts x and y as numbers", () =>
			assert.equal( pathing.test( { x: 0, y: 0 } ), true ) );

	} );

	it( "adding entities", () => {

		const doodad = new Doodad();
		pathing.addEntity( doodad );

		assert.equal( typeof doodad.enumerateNearby, "function" );
		assert.equal( pathing.enumerateInRange( 0, 0, Infinity ).length, 1 );

	} );

	it( "enumerateNearby", () => {

		const doodad = new Doodad( { x: 0.5, y: 0.5 } );
		pathing.addEntity( doodad );
		const doodads = [
			new Doodad( { x: - 1, y: - 1 } ),
			new Doodad( { x: - 1, y: 0 } ),
			new Doodad( { x: - 1, y: 1 } ),
			new Doodad( { x: 0, y: - 1 } ),
			new Doodad( { x: 0, y: 0 } ),
			new Doodad( { x: 0, y: 1 } ),
			new Doodad( { x: 1, y: - 1 } ),
			new Doodad( { x: 1, y: 0 } ),
			new Doodad( { x: 1, y: 1 } )
		];
		doodads.forEach( doodad => pathing.addEntity( doodad ) );
		const nearby = doodad.enumerateNearby( 0.75 );

		assert.equal( nearby.length, 4 );
		assertSameElements(
			nearby,
			[ doodads[ 4 ], doodads[ 5 ], doodads[ 7 ], doodads[ 8 ] ]
		);

	} );

	it( "#onEntityRemoved", () => {

		const doodad = new Doodad();
		pathing.addEntity( doodad );
		pathing.onEntityRemoved( { entity: doodad } );

		assert.equal( doodad.enumerateNearby, undefined );
		assert.equal( pathing.enumerateInRange( 0, 0, Infinity ).length, 0 );

	} );

	it( "#update", () => {

		const doodad = new Doodad();
		pathing.addEntity( doodad );

		assert.equal( pathing.enumerateInRange( 0, 0, 1 ).length, 1 );
		assert.equal( pathing.entities.length, 1 );
		doodad.x = 2;
		assert.equal( pathing.enumerateInRange( 0, 0, 1 ).length, 0 );
		assert.equal( pathing.entities.length, 1 );

	} );

} );
