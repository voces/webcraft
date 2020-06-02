
import swallow from "./swallow.js";

describe( "swallow", () => {

	it( "properties forever", () => {

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const val = swallow<any>();
		val.a.b.c.d.e.f.g;

	} );

	it( "functions forever", () => {

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const val = swallow<any>();
		val.a().b().c().d().e().f();

	} );

	it( "mixed", () => {

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const val = swallow<any>();
		val.a().b.c().d.e().f;

	} );

} );
