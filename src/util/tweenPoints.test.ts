import { tweenPoints } from "./tweenPoints.js";

describe("tweenPoints", () => {
	it("works", () => {
		const tween = tweenPoints([
			{ x: 0, y: 0 },
			{ x: 0, y: 1 },
			{ x: 1, y: 1 },
			{ x: 1, y: 0 },
		]);

		expect(tween(0)).toEqual({ x: 0, y: 0 });
		expect(tween(0.5)).toEqual({ x: 0, y: 0.5 });
		expect(tween(1)).toEqual({ x: 0, y: 1 });
		expect(tween(1.5)).toEqual({ x: 0.5, y: 1 });
		expect(tween(2)).toEqual({ x: 1, y: 1 });
		expect(tween(2.5)).toEqual({ x: 1, y: 0.5 });
		expect(tween(3)).toEqual({ x: 1, y: 0 });
	});

	it("non-uniform movements", () => {
		const tween = tweenPoints([
			{ x: 0, y: 0 },
			{ x: 0, y: 1 },
			{ x: 0, y: 3 },
		]);

		for (let d = 0; d <= 3; d += 0.5)
			expect(tween(d)).toEqual({ x: 0, y: d });
	});

	describe("radialStepBack", () => {
		it("simple", () => {
			const tween = tweenPoints([
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
			]);
			const result = tween.radialStepBack(2.5);
			const distance = Math.sqrt(
				(tween.target.x - result.x) ** 2 +
					(tween.target.y - result.y) ** 2,
			);

			expect(result).toEqual({ x: 7.5, y: 0 });
			expect(distance).toBeLessThan(2.51);
			expect(distance).toBeGreaterThan(2.49);
		});

		it("multiple steps", () => {
			const tween = tweenPoints([
				{ x: 0, y: 0 },
				{ x: 8, y: 0 },
				{ x: 10, y: 0 },
			]);
			const result = tween.radialStepBack(2.5);
			const distance = Math.sqrt(
				(tween.target.x - result.x) ** 2 +
					(tween.target.y - result.y) ** 2,
			);

			expect(result).toEqual({ x: 7.5, y: 0 });
			expect(distance).toBeLessThan(2.51);
			expect(distance).toBeGreaterThan(2.49);
		});

		it("multiple complex steps", () => {
			const tween = tweenPoints([
				{ x: 0, y: 0 },
				{ x: 5, y: 0 },
				{ x: 5, y: 5 },
				{ x: 0, y: 5 },
			]);
			const result = tween.radialStepBack(6);
			const distance = Math.sqrt(
				(tween.target.x - result.x) ** 2 +
					(tween.target.y - result.y) ** 2,
			);

			expect(result).toEqual({ x: 5, y: 1.6833752096445997 });
			expect(distance).toBeLessThan(6.01);
			expect(distance).toBeGreaterThan(5.99);
		});

		it("project only to the origin point", () => {
			const tween = tweenPoints([
				{ x: 0, y: 0 },
				{ x: 1, y: 0 },
			]);
			const result = tween.radialStepBack(2);
			const distance = Math.sqrt(
				(tween.target.x - result.x) ** 2 +
					(tween.target.y - result.y) ** 2,
			);

			expect(result).toEqual({ x: 0, y: 0 });
			expect(distance).toBeLessThan(1.01);
			expect(distance).toBeGreaterThan(0.99);
		});
	});
});
