type Point = { x: number; y: number };

export const polarProject = (
	point: Point,
	angle: number,
	distance: number,
): Point => ({
	x: point.x + Math.cos(angle) * distance,
	y: point.y + Math.sin(angle) * distance,
});

const orientation = (p1: Point, p2: Point, p: Point) =>
	(p.x - p1.x) * (p2.y - p1.y) - (p.y - p1.y) * (p2.x - p1.x);

export const behind = (
	leftTangent: Point,
	rightTangent: Point,
	x: number,
	y: number,
): boolean => orientation(leftTangent, rightTangent, { x, y }) < 0;

export const infront = (
	leftTangent: Point,
	rightTangent: Point,
	x: number,
	y: number,
): boolean => orientation(leftTangent, rightTangent, { x, y }) > 0;

export const trueMinX = (
	point: { x: number; y: number },
	radius: number,
	y: number,
	offValue: number,
): number => {
	if (Math.abs(point.y - y) - 0.5 <= 1) return offValue;

	if (y > point.y) {
		const squared =
			-(point.y ** 2) + 2 * point.y * y + radius ** 2 - y ** 2;

		const core = Math.sign(squared) * Math.abs(squared) ** 0.5;

		return Math.floor(point.x - core);
	}

	const squared =
		-(point.y ** 2) + 2 * point.y * (y + 1) + radius ** 2 - (y + 1) ** 2;

	const core = Math.sign(squared) * Math.abs(squared) ** 0.5;

	return Math.floor(point.x - core);
};

export const trueMaxX = (
	point: { x: number; y: number },
	radius: number,
	y: number,
	offValue: number,
): number => {
	if (Math.abs(point.y - y) - 0.5 <= 1) return offValue;

	if (y > point.y) {
		const squared =
			-(point.y ** 2) + 2 * point.y * y + radius ** 2 - y ** 2;

		const core = Math.sign(squared) * Math.abs(squared) ** 0.5;

		return Math.floor(point.x + core);
	}

	const squared =
		-(point.y ** 2) + 2 * point.y * (y + 1) + radius ** 2 - (y + 1) ** 2;

	const core = Math.sign(squared) * Math.abs(squared) ** 0.5;

	return Math.floor(point.x + core);
};
