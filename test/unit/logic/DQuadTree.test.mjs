
import assert from "assert";
import sinon from "sinon";
import alea from "../../../lib/alea.mjs";
import DQuadTree from "../../../src/logic/DQuadTree.mjs";

// TODO: investigate how to block usage of Math.random
//       would be nice for implementers, too :D
const random = alea( import.meta.url );

let itemId = 0;
class Item {

	constructor( x = random(), y = random(), radius = 0 ) {

		this.x = x;
		this.y = y;
		this.radius = radius;
		// For sorting/comparing
		this.id = itemId ++;

	}

}

const assertSameElements = ( actual, expected ) =>
	assert.deepStrictEqual(
		actual.map( i => i.id ).sort( ( a, b ) => b - a ),
		expected.map( i => i.id ).sort( ( a, b ) => b - a )
	);

describe( "DQuadTree", { parallel: false }, () => {

	let qt;
	beforeEach( () => qt = new DQuadTree() );

	it( "#constructor", () => {

		const qt = new DQuadTree( { density: 5 } );
		assert.equal( qt.density, 5 );
		assert.equal( qt.length, 0 );
		assertSameElements( Array.from( qt ), [] );

	} );

	describe( "#push", () => {

		it( "one item", () => {

			const item = new Item();
			qt.push( item );
			assert.equal( qt.length, 1 );
			assertSameElements( Array.from( qt ), [ item ] );

		} );

		it( "two items", () => {

			const items = [ new Item(), new Item() ];
			items.forEach( item => qt.push( item ) );
			assert.equal( qt.length, items.length );
			assertSameElements( Array.from( qt ), items );

		} );

		it( "density + 1 items", () => {

			sinon.spy( qt, "split" );
			const items = Array( qt.density + 1 ).fill().map( () => new Item() );
			items.forEach( item => qt.push( item ) );
			assert.equal( qt.length, items.length );

			assertSameElements( Array.from( qt ), items );
			assert.equal( qt.split.calledOnce, true );

		} );

		it( "1000 items", () => {

			for ( let i = 0; i < 1000; i ++ )
				qt.push( new Item() );
			assert.equal( qt.length, 1000 );

		} );

		it( "density + 1 items at same spot", () => {

			sinon.spy( qt, "split" );
			const items = Array( qt.density + 1 ).fill().map( () => new Item( 0.5, 0.5 ) );
			items.forEach( item => qt.push( item ) );
			assert.equal( qt.length, items.length );
			assertSameElements( Array.from( qt ), items );
			assert.equal( qt.split.calledOnce, false );

		} );

		it( "edge", () => {

			const items = [];
			for ( let i = 0; i < 5; i ++ ) {

				const newItems = [
					new Item( - 1, 0 ),
					new Item( 1, 0 )
				];

				items.push( ...newItems );
				newItems.forEach( i => qt.push( i ) );

			}

			const item = new Item();
			items.push( item );
			qt.push( item );

			assert.equal( qt.length, 11 );
			assertSameElements( Array.from( qt ), items );

		} );

	} );

	describe( "#remove", () => {

		it( "push one remove one", () => {

			const item = new Item();
			qt.push( item );
			qt.remove( item );
			assert.equal( qt.length, 0 );
			assertSameElements( Array.from( qt ), [] );

		} );

		it( "push two remove one", () => {

			const items = [ new Item(), new Item() ];
			items.forEach( item => qt.push( item ) );
			qt.remove( items[ 0 ] );
			assert.equal( qt.length, 1 );
			assertSameElements( Array.from( qt ), [ items[ 1 ] ] );

		} );

		it( "push density + 1, remove density * 25% + 1", () => {

			sinon.spy( qt, "collapse" );
			const items = Array( qt.density + 1 ).fill().map( () => new Item() );
			const removeCount = Math.ceil( qt.density * ( DQuadTree.densityThrash - 1 ) + 1 );
			items.forEach( item => qt.push( item ) );
			items.slice( 0, removeCount ).forEach( item => qt.remove( item ) );
			assert.equal( qt.length, items.length - removeCount );
			assertSameElements( Array.from( qt ), items.slice( removeCount ) );
			assert.equal( qt.collapse.calledOnce, true );

		} );

	} );

	describe( "#iterateInRange", () => {

		let items;
		beforeEach( () => {

			items = [
				new Item( - 1, - 1 ),
				new Item( - 1, 0 ),
				new Item( - 1, 1 ),
				new Item( 0, - 1 ),
				new Item( 0, 0 ),
				new Item( 0, 1 ),
				new Item( 1, - 1 ),
				new Item( 1, 0 ),
				new Item( 1, 1 )
			];
			items.forEach( item => qt.push( item ) );

		} );

		it( "min + max", () => {

			assert.equal( qt.length, items.length );
			assertSameElements(
				qt.enumerateInRange( - 1, - 1, 0, 1 ),
				items.slice( 0, 6 ),
			);

		} );

		it( "center + range", () => {

			assert.equal( qt.length, items.length );
			assertSameElements(
				qt.enumerateInRange( 0, 0, 1 ),
				[ items[ 1 ], items[ 3 ], items[ 4 ], items[ 5 ], items[ 7 ] ]
			);

		} );

		it( "prop format", () => {

			assert.equal( qt.length, items.length );
			assertSameElements(
				qt.enumerateInRange( { x: 0, y: 0, radius: 1 } ),
				[ items[ 1 ], items[ 3 ], items[ 4 ], items[ 5 ], items[ 7 ] ]
			);

		} );

		it( "with update", () => {

			items[ 5 ].x = 10;
			qt.update( items[ 5 ] );
			assertSameElements(
				qt.enumerateInRange( { x: 0, y: 0, radius: 1 } ),
				[ items[ 1 ], items[ 3 ], items[ 4 ], items[ 7 ] ]
			);
			assert.equal( qt.length, items.length );

		} );

	} );

	it( "cycled pushes, removes, and updates", () => {

		const items = [];
		let pushes = 0;
		let removes = 0;

		for ( let i = 1; i < 1000; i ++ )
			if ( i % 7 === 0 ) {

				const index = Math.floor( random() * items.length );
				const item = items[ index ];
				items.splice( index, 1 );
				qt.remove( item );
				removes ++;

			} else if ( i % 2 === 0 ) {

				const index = Math.floor( random() * items.length );
				const item = items[ index ];
				item.x = random();
				item.y = random();
				qt.update( item );

			} else {

				const item = new Item();
				items.push( item );
				qt.push( item );
				pushes ++;

			}

		assert.equal( qt.length, items.length );
		assert.equal( pushes - removes, items.length );
		assertSameElements( Array.from( qt ), items );

		const lengthStack = [ qt ];
		while ( lengthStack.length ) {

			const qt = lengthStack.pop();
			if ( ! qt.children ) continue;

			assert.equal( qt.length, qt.children.reduce( ( sum, qt ) => sum + qt.length ), 0 );
			lengthStack.push( ...qt.children );

		}

	} );

} );
