
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

// export const TILE_COLORS = {
// 	open: [ 0, 128, 0 ],
// 	block: [ 85, 85, 85 ],
// 	start: [ 86, 150, 85 ],
// 	end: [ 86, 150, 85 ],
// 	spawn: [ 0, 128, 0 ],
// };
