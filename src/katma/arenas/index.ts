import { theDump } from "./theDump";
import { theFarm } from "./theFarm";
// import { theGap } from "./theGap";
// import { theRock } from "./theRock";
// import { theTamedWoods } from "./theTamedWoods";
// import { theTarget } from "./theTarget";
// import { theTinyRectangle } from "./theTinyRectangle";
// import { theWoods } from "./theWoods";

import { PATHING_TYPES } from "../../engine/pathing/constants";
import { Arena, InternalArena } from "./types";
import { Point } from "../../engine/pathing/PathingMap";

const UNPATHABLE = PATHING_TYPES.WALKABLE + PATHING_TYPES.BUILDABLE;

const getHeight = (arena: InternalArena) => arena.cliffs.length * 2;
const getWidth = (arena: InternalArena) =>
	Math.max(...arena.cliffs.map((l) => l.length)) * 2;

const _asMaxNum = (v: number | "r") => (typeof v === "number" ? v : -Infinity);
const cliffHeight = (cliffs: (number | "r")[][], x: number, y: number) => {
	const v = cliffs[y][x];
	if (typeof v === "number") return v;
	return Math.max(
		_asMaxNum(cliffs[y][x - 1]),
		_asMaxNum(cliffs[y][x + 1]),
		_asMaxNum(cliffs[y - 1][x]),
		_asMaxNum(cliffs[y + 1][x]),
	);
};
const getPathingCliffs = (cliffs: (number | "r")[][]): number[][] =>
	cliffs.map((row, y) => row.map((_, x) => cliffHeight(cliffs, x, y)));

const neighbors = [
	{ x: -1, y: -1 },
	{ x: 0, y: -1 },
	{ x: 1, y: -1 },
	{ x: -1, y: 0 },
	{ x: 1, y: 0 },
	{ x: -1, y: 1 },
	{ x: 0, y: 1 },
	{ x: 1, y: 1 },
];

// Turns [[x]] into [[x, x], [x, x]]
const double = <T>(arr: T[][]): T[][] => {
	const newArr: T[][] = [];

	for (const row of arr) {
		const newRow: T[] = [];
		for (const value of row) newRow.push(value, value);
		newArr.push(newRow, [...newRow]);
	}

	return newArr;
};

const processArena = (arena: InternalArena): Arena => {
	const height = getHeight(arena);
	const width = getWidth(arena);

	const cliffs = double(arena.cliffs.map((row) => row.map((v) => v ?? 0)));

	const tiles = double(arena.tiles);

	const pathing: number[][] = Array(height)
		.fill(0)
		.map((_, y) =>
			Array(width)
				.fill(0)
				.map((_, x) => {
					if (
						y === 0 ||
						y === height - 1 ||
						x === 0 ||
						x === width - 1
					)
						return UNPATHABLE;

					const cur = cliffs[y][x];
					let rampNeighbors = 0;
					let firstNonRampNeighrborHeight;
					let firstDiagRamp: Point;

					for (const neighbor of neighbors) {
						const tile = cliffs[y + neighbor.y]?.[x + neighbor.x];

						// Edges are unpathable
						if (tile === undefined) return UNPATHABLE;

						if (tile !== "r")
							if (firstNonRampNeighrborHeight !== undefined) {
								// Cliff changes are not pathable
								if (firstNonRampNeighrborHeight !== tile)
									return UNPATHABLE;
							} else firstNonRampNeighrborHeight = tile;
						else {
							rampNeighbors++;
							// diag
							if (neighbor.x !== 0 && neighbor.y !== 0)
								firstDiagRamp = neighbor;
						}
					}

					if (
						// 1 ramp means we're flat and a ramp is diag
						rampNeighbors === 1 ||
						// 2 ramps mean we're flat and a ramp is adj+diag
						rampNeighbors === 2 ||
						// 3 ramps + we're ramp means we're a corner ramp
						(cur === "r" && rampNeighbors === 3)
					)
						if (
							cliffs[y + firstDiagRamp!.y]?.[
								x + firstDiagRamp!.x * 3
							] !== "r" ||
							cliffs[y + firstDiagRamp!.y * 3]?.[
								x + firstDiagRamp!.x
							] !== "r"
						)
							return UNPATHABLE;

					// Tiles 1 and 2 are unbuildable
					if (tiles[y]?.[x] === 1 || tiles[y]?.[x] === 2)
						return PATHING_TYPES.BUILDABLE;

					// Otherwise it is pathable
					return 0;
				}),
		);

	return {
		cliffs,
		height,
		name: arena.name,
		pathing,
		tiles,
		width,
		pathingCliffs: getPathingCliffs(cliffs),
	};
};

export const arenas = [
	theDump,
	theFarm,
	// theGap,
	// theRock,
	// theTamedWoods,
	// theTarget,
	// theTinyRectangle,
	// theWoods,
].map(processArena);
