import { theDump } from "./theDump";
import { theFarm } from "./theFarm";
import { theGap } from "./theGap";
import { theRock } from "./theRock";
import { theTamedWoods } from "./theTamedWoods";
import { theTarget } from "./theTarget";
import { theTinyRectangle } from "./theTinyRectangle";
import { theWoods } from "./theWoods";

import { PATHING_TYPES } from "../pathing/constants";
import { Arena, InternalArena } from "./types";

const getHeight = (arena: InternalArena) => arena.layers.length;
const getWidth = (arena: InternalArena) =>
	Math.max(
		...arena.layers.map((l) => l.length),
		...arena.tiles.map((t) => t.length),
	);
const getPathableLayers = (arena: InternalArena) =>
	Array.from(new Set(arena.layers.flat())).filter(
		(layer, _, arr) =>
			!isNaN(layer) && (layer <= 1 || arr.includes(layer - 1)),
	);

const processArena = (arena: InternalArena): Arena => {
	const height = getHeight(arena);
	const width = getWidth(arena);
	const pathableLayers = getPathableLayers(arena);

	const pathing = Array(height)
		.fill(0)
		.map((_, y) =>
			Array(width)
				.fill(0)
				.map((_, x) =>
					!(
						arena.layers[y][x] === 0 ||
						isNaN(arena.layers[y][x]) ||
						pathableLayers.includes(arena.layers[y][x])
					)
						? PATHING_TYPES.WALKABLE | PATHING_TYPES.BUILDABLE
						: isNaN(arena.tiles[y][x])
						? PATHING_TYPES.WALKABLE | PATHING_TYPES.BUILDABLE
						: arena.tiles[y][x] === 1 || arena.tiles[y][x] === 2
						? PATHING_TYPES.BUILDABLE
						: 0,
				),
		);

	return Object.assign(arena, {
		layers: arena.layers.map((row) => row.map((v) => v || 0)),
		pathing,
	});
};

export const arenas = [
	theDump,
	theFarm,
	theGap,
	theRock,
	theTamedWoods,
	theTarget,
	theTinyRectangle,
	theWoods,
].map(processArena);
