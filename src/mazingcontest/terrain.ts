import {
	processArena,
	stringMap,
	stringMapWithRamps,
	trimMap,
} from "../engine/entities/terrainHelpers";
import type { Point } from "../engine/pathing/PathingMap";

const repeat = (map: string) => {
	const h = trimMap(map)
		.split("\n")
		.map((v) => Array(5).fill(v).join("."));
	return Array(4)
		.fill(h.join("\n"))
		.join(`\n${".".repeat(h[0].length)}\n`);
};

export const terrain = processArena({
	name: "Mazing Contest",
	// For jumping
	cliffs: stringMapWithRamps(
		repeat(`
			000000000000000000
			000000000000000000
			000000000000000000
			000222221122222000
			000211111111112000
			00021        12000
			00021        12000
			00021        12000
			00021        12000
			00021        12000
			00021        12000
			00021        12000
			00021        12000
			000211111111112000
			000222221122222000
			000000000000000000
			000000000000000000
			000000000000000000
		`),
		1,
	),
	tiles: stringMap(
		repeat(`
			000000000000000000
			0                0
			0                0
			0       11       0
			0                0
			0                0
			0                0
			0                0
			0                0
			0                0
			0                0
			0                0
			0                0
			0                0
			0       11       0
			0                0
			0                0
			000000000000000000
		`),
	),
});

const offsetMultiples = [
	// 0
	{ x: 0, y: 0 }, // 0

	//   1
	// 2 3
	{ x: 1, y: 0 }, // 1
	{ x: 0, y: 1 }, // 2
	{ x: 1, y: 1 }, // 3

	//     4
	//     6
	// 5 7 8
	{ x: 2, y: 0 }, // 4
	{ x: 0, y: 2 }, // 5
	{ x: 2, y: 1 }, // 6
	{ x: 1, y: 2 }, // 7
	{ x: 2, y: 2 }, // 8

	//           9
	//          11
	//          13
	// 10 12 14 15
	{ x: 3, y: 0 }, // 9
	{ x: 0, y: 3 }, // 10
	{ x: 3, y: 1 }, // 11
	{ x: 1, y: 3 }, // 12
	{ x: 3, y: 2 }, // 13
	{ x: 2, y: 3 }, // 14
	{ x: 3, y: 3 }, // 15

	//             16
	//             17
	//             18
	//             19
	{ x: 4, y: 0 }, // 16
	{ x: 4, y: 1 }, // 17
	{ x: 4, y: 2 }, // 18
	{ x: 4, y: 3 }, // 19
];

export const levelSize = { width: 36, height: 36 };
export const offset = (i: number): Point => ({
	x: offsetMultiples[i].x * (levelSize.width + 2),
	y: offsetMultiples[i].y * (levelSize.height + 2),
});
export const center = (i: number): Point => {
	const lOffset = offset(i);
	return {
		x: lOffset.x + levelSize.width / 2,
		y: lOffset.y + levelSize.height / 2,
	};
};
export const spawn = (i: number): Point => {
	const lCenter = center(i);
	return {
		x: lCenter.x,
		y: lCenter.y - 10.5,
	};
};
export const target = (i: number): Point => {
	const lCenter = center(i);
	return {
		x: lCenter.x,
		y: lCenter.y + 10.5,
	};
};
