
import { describe, it } from "verit-test";
import chai from "chai";

import tweenPoints from "./tweenPoints.js";

const assert = chai.assert;

describe( "tweenPoints", () => {

	it( "works", () => {

		const tween = tweenPoints( [
			{ x: 0, y: 0 },
			{ x: 0, y: 1 },
			{ x: 1, y: 1 },
			{ x: 1, y: 0 },
		] );

		assert.deepStrictEqual(
			tween( 0 ),
			{ x: 0, y: 0 }
		);
		assert.deepStrictEqual(
			tween( 0.5 ),
			{ x: 0, y: 0.5 }
		);
		assert.deepStrictEqual(
			tween( 1 ),
			{ x: 0, y: 1 }
		);
		assert.deepStrictEqual(
			tween( 1.5 ),
			{ x: 0.5, y: 1 }
		);
		assert.deepStrictEqual(
			tween( 2 ),
			{ x: 1, y: 1 }
		);
		assert.deepStrictEqual(
			tween( 2.5 ),
			{ x: 1, y: 0.5 }
		);
		assert.deepStrictEqual(
			tween( 3 ),
			{ x: 1, y: 0 }
		);

	} );

	it( "non-uniform movements", () => {

		const tween = tweenPoints( [
			{ x: 0, y: 0 },
			{ x: 0, y: 1 },
			{ x: 0, y: 3 },
		] );

		for ( let d = 0; d <= 3; d += 0.5 )
			assert.deepStrictEqual(
				tween( d ),
				{ x: 0, y: d }
			);

	} );

	describe( "radialStepBack", () => {

		it( "simple", () => {

			const tween = tweenPoints( [
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
			] );
			const result = tween.radialStepBack( 2.5 );
			const distance = Math.sqrt( ( tween.target.x - result.x ) ** 2 + ( tween.target.y - result.y ) ** 2 );

			assert.deepStrictEqual( result, { x: 7.5, y: 0 } );
			assert.isBelow( distance, 2.51 );
			assert.isAbove( distance, 2.49 );

		} );

		it( "multiple steps", () => {

			const tween = tweenPoints( [
				{ x: 0, y: 0 },
				{ x: 8, y: 0 },
				{ x: 10, y: 0 },
			] );
			const result = tween.radialStepBack( 2.5 );
			const distance = Math.sqrt( ( tween.target.x - result.x ) ** 2 + ( tween.target.y - result.y ) ** 2 );

			assert.deepStrictEqual( result, { x: 7.5, y: 0 } );
			assert.isBelow( distance, 2.51 );
			assert.isAbove( distance, 2.49 );

		} );

		it( "multiple complex steps", () => {

			const tween = tweenPoints( [
				{ x: 0, y: 0 },
				{ x: 5, y: 0 },
				{ x: 5, y: 5 },
				{ x: 0, y: 5 },
			] );
			const result = tween.radialStepBack( 6 );
			const distance = Math.sqrt( ( tween.target.x - result.x ) ** 2 + ( tween.target.y - result.y ) ** 2 );

			assert.deepStrictEqual( result, { x: 5, y: 1.6833752096445997 } );
			assert.isBelow( distance, 6.01 );
			assert.isAbove( distance, 5.99 );

		} );

		it( "project only to the origin point", () => {

			const tween = tweenPoints( [
				{ x: 0, y: 0 },
				{ x: 1, y: 0 },
			] );
			const result = tween.radialStepBack( 2 );
			const distance = Math.sqrt( ( tween.target.x - result.x ) ** 2 + ( tween.target.y - result.y ) ** 2 );

			assert.deepStrictEqual( result, { x: 0, y: 0 } );
			assert.isBelow( distance, 1.01 );
			assert.isAbove( distance, 0.99 );

		} );

	} );

} );
