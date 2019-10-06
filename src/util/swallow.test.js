
import { describe, it } from "verit-test";

import swallow from "./swallow.js";

describe( "swallow", () => {

	it( "properties forever", () => {

		const val = swallow();
		val.a.b.c.d.e.f.g;

	} );

	it( "functions forever", () => {

		const val = swallow();
		val.a().b().c().d().e().f();

	} );

	it( "mixed", () => {

		const val = swallow();
		val.a().b.c().d.e().f;

	} );

} );
