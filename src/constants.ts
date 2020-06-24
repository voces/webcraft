import { ValueOf } from "./types.js";

// A map
export const TILE_NAMES = ["open", "start", "end", "spawn"];
export const TILE_TYPES = {
	OPEN: 0,
	START: 1,
	END: 2,
	SPAWN: 3,
} as const;
export type TileType = ValueOf<typeof TILE_TYPES>;

export const WORLD_TO_GRAPHICS_RATIO = 32;

// A mask
export * from "./pathing/constants.js";

export const INITIAL_OBSTRUCTION_PROGRESS = 0.1;

export const MIRROR_SEPARATION = 2;
