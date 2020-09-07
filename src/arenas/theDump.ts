import { cliffMap } from "notextures";
import { stringMap } from "./util";
import { InternalArena } from "./types";

export const theDump: InternalArena = {
	name: "The Dump",
	// For jumping
	cliffs: cliffMap(`
			000000000
			011111110
			01.....10
			01.....100 000   000
			01.....1100010000010
			01......111011010100
			01......11111001100000
			01......10011111111110
			01......1111........10
			01..................10
			01..................10
			01..................10
			01..................10
			01..................10
			0331................10
			0333311111111111111110
			0000000000000000000000
		`),
	// 0 = open space
	// 1 = crosser spawn
	// 2 = crosser target
	// 3 = defender spawn
	tiles: stringMap(`
		0000000000000000000000
		0                    0
		0 11111              0
		0                    0
		0                    0
		0                    0
		0                    0
		0                    0
		0                  2 0
		0                  2 0
		0             333  2 0
		0             333  2 0
		0             333  2 0
		0                  2 0
		0                  2 0
		0                    0
		0000000000000000000000
    `),
};
