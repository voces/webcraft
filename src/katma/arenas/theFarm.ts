import { stringMap, stringMapWithRamps } from "./util";
import { InternalArena } from "./types";

export const theFarm: InternalArena = {
	name: "The Farm",
	// For jumping
	cliffs: stringMapWithRamps(
		`
			4444444444444444444444444444
			3                          3
			3                          3
			3                          3
			3                          3
			3                          3
			3                          3
			3                          3
			3                          3
			3       rr rr              3
			3      3333333             3
			3     r3333333r            3
			3     r3333333r            3
			3     r3333333             3
			33      430 3 3 333333333333
			33333333333343333
		`,
		1,
	),
	// 0 = open space
	// 1 = crosser spawn
	// 2 = crosser target
	// 3 = defender spawn
	tiles: stringMap(`
		0000000000000000000000000000
		0                          0
		0 1                      2 0
		0 1                      2 0
		0 1                      2 0
		0 1                      2 0
		0 1               333    2 0
		0 1               333    2 0
		0 1               333    2 0
		0 1                      2 0
		0 1                      2 0
		0 1                      2 0
		0 1                      2 0
		0                          0
		0               000000000000
		00000000000000000
	`),
};
