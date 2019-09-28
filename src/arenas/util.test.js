
import { describe, it } from "verit-test";
import chai from "chai";

import { stringMap } from "./util.js";

const assert = chai.assert;

describe( "stringMap", () => {

	it( "works", () => {

		assert.deepStrictEqual(
			stringMap( `
                123
                456
                789
            ` ),
			[
				[ 1, 2, 3 ],
				[ 4, 5, 6 ],
				[ 7, 8, 9 ],
			]
		);

	} );

} )
;
