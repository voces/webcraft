
import { describe, it } from "verit-test";
import chai from "chai";

import tilemap from "./tilemap.js";

const assert = chai.assert;

describe( "tilemap", () => {

	it( "Tiny", () => {

		assert.deepStrictEqual(
			tilemap( 0.5 ),
			{
				map: Array( 2 * 2 ).fill( 3 ),
				top: - 1,
				left: - 1,
				width: 2,
				height: 2,
			}
		);

	} );

	it( "Baisc", () => {

		assert.deepStrictEqual(
			tilemap( 1 ),
			{
				map: Array( 4 * 4 ).fill( 3 ),
				top: - 2,
				left: - 2,
				width: 4,
				height: 4,
			}
		);

	} );

	it( "Large", () => {

		assert.deepStrictEqual(
			tilemap( 1.5 ),
			{
				map: Array( 6 * 6 ).fill( 3 ),
				top: - 3,
				left: - 3,
				width: 6,
				height: 6,
			}
		);

	} );

	it( "Huge", () => {

		assert.deepStrictEqual(
			tilemap( 2 ),
			{
				map: Array( 8 * 8 ).fill( 3 ),
				top: - 4,
				left: - 4,
				width: 8,
				height: 8,
			}
		);

	} );

} );
