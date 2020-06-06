import { clone } from "./clone.js";

describe("clone", () => {
	it("smoke", () => {
		const original = {
			a: true,
			b: "string",
			c: { e: {} },
			f: [
				() => {
					/* do nothing */
				},
			],
		};
		const cloned = clone(original);

		expect(original).toEqual(cloned);
		expect(original).not.toBe(cloned);
		expect(original.c).not.toBe(cloned.c);
		expect(original.c.e).not.toBe(cloned.c.e);
		expect(original.f).not.toBe(cloned.f);
	});
});
