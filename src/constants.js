
// A map
export const TILE_NAMES = [
	"open",
	"start",
	"end",
	"spawn",
];
export const TILE_TYPES = TILE_NAMES.reduce( ( obj, name, index ) =>
	Object.assign( obj, { [ name.toUpperCase() ]: index } ), {} );

export const WORLD_TO_GRAPHICS_RATIO = 32;

// A mask
export * from "./pathing/constants.js";

export const INITIAL_OBSTRUCTION_PROGRESS = 0.1;
