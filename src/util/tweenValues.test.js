
import { describe, it } from "verit-test";
import chai from "chai";

import tweenValues from "./tweenValues.js";

const assert = chai.assert;

describe( "tweenValues", () => {

	it( "negative", () => {

		const tween = tweenValues( 0, 1 );

		assert.equal( tween( - 1 ), 0 );

	} );

	it( "past end", () => {

		const tween = tweenValues( 0, 1 );

		assert.equal( tween( 2 ), 1 );

	} );

	it( "start", () => {

		const tween = tweenValues( 0, 1 );

		assert.equal( tween( 0 ), 0 );

	} );

	it( "end", () => {

		const tween = tweenValues( 0, 1 );

		assert.equal( tween( 1 ), 1 );

	} );

	it( "along the line", () => {

		const tween = tweenValues( 0, 2 );

		assert.equal( tween( 0.25 ), 0.5 );
		assert.equal( tween( 0.5 ), 1 );
		assert.equal( tween( 0.75 ), 1.5 );

	} );

	it( "with multiple points", () => {

		const tween = tweenValues( 0, 1, 4 );

		assert.equal( tween( - 1 ), 0 );
		assert.equal( tween( 0 ), 0 );
		assert.equal( tween( 1 / 4 ), 1 );
		assert.equal( tween( 1 / 2 ), 2 );
		assert.equal( tween( 3 / 4 ), 3 );
		assert.equal( tween( 1 ), 4 );
		assert.equal( tween( 2 ), 4 );

	} );

} );
