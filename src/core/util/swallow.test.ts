import { swallow } from "./swallow";

describe("swallow", () => {
	it("properties forever", () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const val = swallow<any>();
		val.a.b.c.d.e.f.g;
	});

	it("functions forever", () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const val = swallow<any>();
		val.a().b().c().d().e().f();
	});

	it("mixed", () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const val = swallow<any>();
		val.a().b.c().d.e().f;
	});

	it("memory works", () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const val = swallow<{ a: number; q: any }>({ a: 7 });
		expect(val.a).toEqual(7);
		val.q().b.c().d.e().f;
	});

	it("deep memory works", () => {
		const val = swallow<{ a: () => { b: () => number; c: () => unknown } }>(
			{
				a: () => swallow({ b: () => 5 }),
			},
		);
		expect(val.a().b()).toEqual(5);
		val.a().c();
	});
});
