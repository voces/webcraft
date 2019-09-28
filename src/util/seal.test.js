
import { describe, it } from "verit-test";
import chai from "chai";

import seal from "./seal.js";

const assert = chai.assert;

describe( "seal", () => {

	it( "protects getters", () => {

		const myObj = { a: 0, b: 1, c: 2 };
		const sealed = seal( myObj );

		assert.equal( sealed.a, 0 );
		assert.equal( sealed.b, 1 );
		assert.equal( sealed.c, 2 );

		assert.throws( () => sealed.d, "Object does not have property 'd'" );

	} );

	it( "protects setters", () => {

		const myObj = { a: 0, b: 1, c: 2 };
		const sealed = seal( myObj );

		sealed.a = 3;
		sealed.b = true;
		sealed.c = { foo: "bar" };

		assert.equal( sealed.a, 3 );
		assert.equal( sealed.b, true );
		assert.deepStrictEqual( sealed.c, { foo: "bar" } );

		assert.throws( () => sealed.d = 0, "Object does not have property 'd'" );

	} );

} );
