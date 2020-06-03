export const array2 = (
	x: number,
	y: number,
	fn: (x: number, y: number) => number = (): number => 0,
): number[][] =>
	Array(y)
		.fill(0)
		.map((_, y) =>
			Array(x)
				.fill(0)
				.map((_, x) => fn(x, y)),
		);
