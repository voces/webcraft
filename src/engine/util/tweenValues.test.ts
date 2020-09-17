import { tweenValues } from "./tweenValues";

describe("tweenValues", () => {
	it("negative", () => {
		const tween = tweenValues(0, 1);

		expect(tween(-1)).toEqual(0);
	});

	it("past end", () => {
		const tween = tweenValues(0, 1);

		expect(tween(2)).toEqual(1);
	});

	it("start", () => {
		const tween = tweenValues(0, 1);

		expect(tween(0)).toEqual(0);
	});

	it("end", () => {
		const tween = tweenValues(0, 1);

		expect(tween(1)).toEqual(1);
	});

	it("along the line", () => {
		const tween = tweenValues(0, 2);

		expect(tween(0.25)).toEqual(0.5);
		expect(tween(0.5)).toEqual(1);
		expect(tween(0.75)).toEqual(1.5);
	});

	it("with multiple points", () => {
		const tween = tweenValues(0, 1, 4);

		expect(tween(-1)).toEqual(0);
		expect(tween(0)).toEqual(0);
		expect(tween(1 / 4)).toEqual(1);
		expect(tween(1 / 2)).toEqual(2);
		expect(tween(3 / 4)).toEqual(3);
		expect(tween(1)).toEqual(4);
		expect(tween(2)).toEqual(4);
	});
});
