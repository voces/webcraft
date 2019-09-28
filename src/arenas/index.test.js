
import { describe, it } from "verit-test";
import chai from "chai";

import arenas from "./index.js";

const assert = chai.assert;

describe( "arenas", () => {

	it( "length", () => {

		assert.equal( arenas.length, 1 );

	} );

	it( "form", () => {

		arenas.forEach( arena => {

			assert.sameMembers(
				Object.keys( arena ),
				[ "layers", "tiles", "pathing" ]
			);

			assert.equal(
				arena.layers instanceof Array,
				true
			);

			assert.equal(
				arena.layers[ 0 ] instanceof Array,
				true
			);

			assert.equal(
				arena.tiles instanceof Array,
				true
			);

			assert.equal(
				arena.tiles[ 0 ] instanceof Array,
				true
			);

			assert.equal(
				arena.pathing instanceof Array,
				true
			);

			assert.equal(
				arena.pathing[ 0 ] instanceof Array,
				true
			);

		} );

	} );

} );
