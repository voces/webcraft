
const assert = require( "assert" );

import { Mesh } from "../../../../node_modules/three/build/three.module.js";

import Handle from "../../../../src/core/Handle.js";
import Doodad from "../../../../src/entities/Doodad.js";

export default () => describe( "Doodad", () => {

	it( "Extends Handle", () => assert.ok( new Doodad() instanceof Handle ) );
	it( "Automatic key", () => {

		const doodad = new Doodad();

		assert.ok( doodad.key.startsWith( "d" ) );
		assert.equal( parseInt( doodad.key.slice( 1 ) ), doodad.id );

	} );

	it( "toState()", () => {

		const doodad = new Doodad();

		assert.deepEqual( doodad.toState(), { key: doodad.key, _collection: "doodads", _constructor: "Doodad", x: 0, y: 0, z: 0, facing: 0 } );

	} );

	[ "x", "y", "z" ].forEach( prop => {

		it( "set/get " + prop, function ( done ) {

			this.timeout( 10 );

			const doodad = new Doodad();
			let calls = 0;
			doodad.addEventListener( "dirty", () => calls ++ );
			doodad.addEventListener( "clean", () => ( ++ calls ) === 2 ? done() : null );

			const value1 = Math.random();
			assert.equal( doodad.dirty, 0 );
			doodad[ prop ] = value1;
			assert.equal( doodad.dirty, 0 );
			assert.deepEqual( doodad[ prop ], value1 );
			assert.deepEqual( doodad._props[ prop ], value1 );

			const value2 = Math.random();
			assert.equal( doodad.dirty, 0 );
			doodad[ prop ] = () => value2;
			assert.equal( doodad.dirty, 1 );
			assert.deepEqual( doodad[ prop ], value2 );
			doodad[ prop ] = value1;
			assert.equal( doodad.dirty, 0 );

		} );

	} );

	it( "set/get model", function ( done ) {

		this.timeout( 100 );

		const doodad = new Doodad();
		doodad.addEventListener( "meshLoaded", () => {

			assert( doodad.mesh instanceof Mesh );

			done();

		} );

		doodad.model = () => import( "../../../../examples/models/CubeModel.js" );

	} );

	it( "update", function ( done ) {

		this.timeout( 10 );

		const doodad = new Doodad();
		const num = Math.random();

		doodad.updates.push( time => ( assert.equal( time, num ), done() ) );

		doodad.update( num );

	} );

} );
