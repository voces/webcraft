
import assert from "assert";
import sinon from "sinon";
import alea from "../../../lib/alea";
import DQuadTree from "../../../src/logic/DQuadTree";

// TODO: investigate how to simply block usage of Math.random
//       would be nice for implementers, too :D
const random = alea( __filename );

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

const assertSameElements = ( left, right ) =>
	assert.deepStrictEqual(
		[ ...left ].map( i => i.id ).sort( ( a, b ) => b - a ),
		[ ...right ].map( i => i.id ).sort( ( a, b ) => b - a )
	);

describe( "DQuadTree", () => {

	it( "#constructor", () => {

		const qt = new DQuadTree( { density: 5 } );
		assert.equal( qt.density, 5 );
		assert.equal( qt.length, 0 );
		assertSameElements( qt, [] );

	} );

	describe( "#push", () => {

		it( "one item", () => {

			const qt = new DQuadTree();
			const item = new Item();
			qt.push( item );
			assert.equal( qt.length, 1 );
			assertSameElements( qt, [ item ] );

		} );

		it( "two items", () => {

			const qt = new DQuadTree();
			const items = [ new Item(), new Item() ];
			items.forEach( item => qt.push( item ) );
			assert.equal( qt.length, items.length );
			assertSameElements( qt, items );

		} );

		it( "density + 1 items", () => {

			const qt = new DQuadTree();
			sinon.spy( qt, "split" );
			const items = Array( qt.density + 1 ).fill().map( () => new Item() );
			items.forEach( item => qt.push( item ) );
			assert.equal( qt.length, items.length );
			assertSameElements( qt, items );
			assert.equal( qt.split.calledOnce, true );

		} );

		it( "1000 items", () => {

			const qt = new DQuadTree();
			for ( let i = 0; i < 1000; i ++ )
				qt.push( new Item() );
			assert.equal( qt.length, 1000 );

		} );

		it( "density + 1 items at same spot", () => {

			const qt = new DQuadTree();
			sinon.spy( qt, "split" );
			const items = Array( qt.density + 1 ).fill().map( () => new Item( 0.5, 0.5 ) );
			items.forEach( item => qt.push( item ) );
			assert.equal( qt.length, items.length );
			assertSameElements( qt, items );
			assert.equal( qt.split.calledOnce, false );

		} );

	} );

	describe( "#remove", () => {

		it( "push one remove one", () => {

			const qt = new DQuadTree();
			const item = new Item();
			qt.push( item );
			qt.remove( item );
			assert.equal( qt.length, 0 );
			assertSameElements( qt, [] );

		} );

		it( "push two remove one", () => {

			const qt = new DQuadTree();
			const items = [ new Item(), new Item() ];
			items.forEach( item => qt.push( item ) );
			qt.remove( items[ 0 ] );
			assert.equal( qt.length, 1 );
			assertSameElements( qt, [ items[ 1 ] ] );

		} );

		it( "push density + 1, remove density * 25% + 1", () => {

			const qt = new DQuadTree();
			sinon.spy( qt, "collapse" );
			const items = Array( qt.density + 1 ).fill().map( () => new Item() );
			const removeCount = Math.ceil( qt.density * ( DQuadTree.densityThrash - 1 ) + 1 );
			items.forEach( item => qt.push( item ) );
			items.slice( 0, removeCount ).forEach( item => qt.remove( item ) );
			assert.equal( qt.length, items.length - removeCount );
			assertSameElements( qt, items.slice( removeCount ) );
			assert.equal( qt.collapse.calledOnce, true );

		} );

		it( "cycled pushes and removes", () => {

			const items = [];

			const qt = new DQuadTree();

			for ( let i = 1; i < 1000; i ++ )
				if ( i % 7 === 0 ) {

					const index = Math.floor( random() * items.length );
					const item = items[ index ];
					items.splice( index, 1 );
					qt.remove( item );

				} else {

					const item = new Item();
					items.push( item );
					qt.push( item );

				}

			assert.equal( qt.length, items.length );
			assertSameElements( qt, items );

		} );

	} );

	describe( "#iterateInRange", () => {

		const setup = () => {

			const qt = new DQuadTree();
			const items = [
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

			return { qt, items };

		};

		it( "min + max", () => {

			const { qt, items } = setup();
			assert.equal( qt.length, items.length );
			const queriedItems = [ ...qt.iterateInRange( - 1, - 1, 0, 1 ) ];
			assert.equal( queriedItems.length, 6 );
			assertSameElements( items.slice( 0, 6 ), queriedItems );

		} );

		it( "center + range", () => {

			const { qt, items } = setup();
			assert.equal( qt.length, items.length );
			const queriedItems = [ ...qt.iterateInRange( 0, 0, 1 ) ];
			assert.equal( queriedItems.length, 5 );
			assertSameElements( [
				items[ 1 ], items[ 3 ], items[ 4 ], items[ 5 ], items[ 7 ]
			], queriedItems );

		} );

	} );

} );
