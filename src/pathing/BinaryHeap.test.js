
import { describe, it } from "verit-test";
import chai from "chai";

import BinaryHeap from "./BinaryHeap.js";

const assert = chai.assert;

describe( "BinaryHeap#constructor", () => {

	it( "sets params and is an array", () => {

		const fn = () => {};
		const heap = new BinaryHeap( fn );

		assert.equal( heap.scoreFunc, fn );
		assert.equal( heap instanceof Array, true );

	} );

} );

describe( "BinaryHeap#push", () => {

	it( "appends child", () => {

		const heap = new BinaryHeap( () => 0 );
		const element1 = {};
		const element2 = {};
		heap.push( element1 );
		heap.push( element2 );

		assert.deepStrictEqual(
			heap,
			[ element1, element2 ]
		);

	} );

} );

describe( "BinaryHeap#pop", () => {

	it( "removes first element and elevates chain", () => {

		const heap = new BinaryHeap( () => 0 );
		const element1 = {};
		const element2 = {};
		heap.push( element1 );
		heap.push( element2 );
		heap.pop();

		assert.deepStrictEqual(
			heap,
			[ element2 ]
		);

	} );

} );

describe( "BinaryHeap#remove", () => {

	it( "removes passed element", () => {

		const heap = new BinaryHeap( n => n );
		heap.push( 3 );
		heap.push( 1 );
		heap.push( 2 );
		heap.remove( 1 );

		assert.deepStrictEqual(
			heap,
			[ 2, 3 ]
		);

	} );

} );

describe( "BinaryHeap#bubbleUp", () => {

	it( "moves an element up to its proper heap order", () => {

		const heap = new BinaryHeap( n => n );
		for ( let i = 20; i > 0; i -- )
			heap.push( i );

		assert.deepStrictEqual(
			heap,
			[
				1, 2, 7, 4, 3,
				10, 8, 11, 5, 12,
				13, 19, 15, 16, 9,
				20, 14, 17, 6, 18,
			]
		);

		const index = heap.length;
		heap[ index ] = 0;
		heap.bubbleUp( index );

		assert.deepStrictEqual(
			heap,
			[
				0,
				1, 7, 4, 2, 10,
				8, 11, 5, 3, 13,
				19, 15, 16, 9, 20,
				14, 17, 6, 18, 12,
			]
		);

	} );

} );

describe( "BinaryHeap#sinkDown", () => {

	it( "moves an element down to its proper heap order", () => {

		const heap = new BinaryHeap( n => n );
		for ( let i = 19; i >= 0; i -- )
			heap.push( i );

		assert.deepStrictEqual(
			heap,
			[
				0, 1, 6, 3, 2,
				9, 7, 10, 4, 11,
				12, 18, 14, 15, 8,
				19, 13, 16, 5, 17,
			]
		);

		heap.unshift( 20 );
		heap.sinkDown( 0 );

		assert.deepStrictEqual(
			heap,
			[
				0, 3, 1, 6, 4,
				2, 9, 7, 10, 5,
				11, 12, 18, 14, 15,
				8, 19, 13, 16, 20,
				17,
			]
		);

	} );

} );
