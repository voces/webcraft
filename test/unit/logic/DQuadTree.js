
import assert from "assert";
import DQuadTree from "../../../src/logic/DQuadTree";

class Item {

	constructor( x = Math.random(), y = Math.random(), radius = 0 ) {

		this.x = x;
		this.y = y;
		this.radius = radius;

	}

}

describe( "DQuadTree", () => {

	it( "#constructor", () => {

		const qt = new DQuadTree();
		assert.equal( qt.length, 0 );
		assert.equal( qt.children, undefined );
		assert.deepStrictEqual( qt.contents, [] );

	} );

	describe( "#push", () => {

		it( "one item", () => {

			const qt = new DQuadTree();
			const item = new Item();
			qt.push( item );
			assert.equal( qt.length, 1 );
			assert.deepStrictEqual( qt._sharedMin, { x: item.x, y: item.y } );
			assert.deepStrictEqual( qt._sharedMax, { x: item.x, y: item.y } );
			assert.deepStrictEqual( qt.overlap, { x: 0, y: 0 } );

		} );

		it( "two items", () => {

			const qt = new DQuadTree();
			const items = [ new Item(), new Item() ];
			items.forEach( item => qt.push( item ) );
			assert.equal( qt.length, 2 );
			// We expect the area defined by sharedMin and sharedMax to be negative; if it's positive, it means items are overlapping
			// We're testing with points, so there should never be overlap
			assert.deepStrictEqual( qt._sharedMin, { x: Math.max( ...items.map( i => i.x ) ), y: Math.max( ...items.map( i => i.y ) ) } );
			assert.deepStrictEqual( qt._sharedMax, { x: Math.min( ...items.map( i => i.x ) ), y: Math.min( ...items.map( i => i.y ) ) } );
			assert( qt.overlap.x < 0 );
			assert( qt.overlap.y < 0 );

		} );

	} );

} );
