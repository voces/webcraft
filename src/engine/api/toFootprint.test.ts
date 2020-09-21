import { toFootprint } from "./toFootprint";

describe("toFootprint", () => {
	it("Tiny", () => {
		expect(toFootprint(0.5)).toEqual({
			map: Array(2 * 2).fill(3),
			top: -1,
			left: -1,
			width: 2,
			height: 2,
		});
	});

	it("Baisc", () => {
		expect(toFootprint(1)).toEqual({
			map: Array(4 * 4).fill(3),
			top: -2,
			left: -2,
			width: 4,
			height: 4,
		});
	});

	it("Large", () => {
		expect(toFootprint(1.5)).toEqual({
			map: Array(6 * 6).fill(3),
			top: -3,
			left: -3,
			width: 6,
			height: 6,
		});
	});

	it("Huge", () => {
		expect(toFootprint(2)).toEqual({
			map: Array(8 * 8).fill(3),
			top: -4,
			left: -4,
			width: 8,
			height: 8,
		});
	});
});
