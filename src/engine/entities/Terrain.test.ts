import { Vector3 } from "three";

import { interpolateZ } from "./Terrain";

describe("interpolateZ", () => {
	it("flat", () => {
		const triangle = [
			new Vector3(0, 0, 0),
			new Vector3(1, 0, 0),
			new Vector3(1, 1, 0),
		] as const;

		expect(interpolateZ(triangle, 0, 0)).toEqual(0);
		expect(interpolateZ(triangle, 0.5, 0.25)).toEqual(0);
		expect(interpolateZ(triangle, 1, 1)).toEqual(0);
	});

	it("simple", () => {
		const triangle = [
			new Vector3(0, 0, 0),
			new Vector3(1, 0, 1),
			new Vector3(1, 1, 1),
		] as const;

		expect(interpolateZ(triangle, 0, 0)).toEqual(0);
		expect(interpolateZ(triangle, 1, 0)).toEqual(1);
		expect(interpolateZ(triangle, 1, 1)).toEqual(1);
	});

	it("sample", () => {
		const triangle = [
			new Vector3(1, 2, 3),
			new Vector3(1, 0, 1),
			new Vector3(-2, 1, 0),
		] as const;

		expect(interpolateZ(triangle, 7, -2)).toEqual(3);
	});
});
