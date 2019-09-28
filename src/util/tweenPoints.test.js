
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

} );
