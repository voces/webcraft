import { stringMap } from "./util";

describe("stringMap", () => {
	it("works", () => {
		expect(
			stringMap(`
			123
			456
			789
		`),
		).toEqual([
			[1, 2, 3],
			[4, 5, 6],
			[7, 8, 9],
		]);
	});
});
