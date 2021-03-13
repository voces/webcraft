import {
	processArena,
	stringMap,
	stringMapWithRamps,
} from "../engine/entities/terrainHelpers";

export const terrain = processArena({
	name: "Mazing Contest",
	// For jumping
	cliffs: stringMapWithRamps(
		`
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
		`,
		1,
	),
	tiles: stringMap(`
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
});
