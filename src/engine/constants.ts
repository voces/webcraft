import { ValueOf } from "./types";

// A map
export const TILE_NAMES = ["open", "start", "end", "spawn"];
export const TILE_TYPES = {
	OPEN: 0,
	START: 1,
	END: 2,
	SPAWN: 3,
} as const;
export type TileType = ValueOf<typeof TILE_TYPES>;

// A mask
export * from "./pathing/constants";

export const INITIAL_OBSTRUCTION_PROGRESS = 0.1;

export const MIRROR_SEPARATION = 2;

// Inclusive of unit radius, allowing for "jumping"
export const BUILD_DISTANCE = 1.4;
