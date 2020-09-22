import { InternalArena } from "./types";
import { stringMap } from "./util";

export const theWoods: InternalArena = {
	name: "The Woods",
	// For jumping
	cliffs: stringMap(`
		222222222222222222222222222222222222222222222222222222222222222222
		222222222222222222222222222222222222222222222222222222222222222222
		22                               2222                           22
		22                               2222                           22
		22                                22                            22
		22                                22                            22
		22                                                              22
		22                                                              22
		22                                                              22
		22                                                              22
		22                                                              22
		22                                                              22
		22                                                              22
		22                                                              22
		22                  22                          22              22
		22                  22                          22              22
		22                                                              22
		22                                                              22
		22                                                              22
		22                                                              22
		22                                                              22
		22                                                              22
		22                                                              22
		22                                                              22
		22                                                              22
		22                                                              22
		22                                22                            22
		22                                22                            22
		22                               2222                           22
		22                               2222                           22
		222222222222222222222222222222222222222222222222222222222222222222
		222222222222222222222222222222222222222222222222222222222222222222
    `),
	// 0 = open space
	// 1 = crosser spawn
	// 2 = crosser target
	// 3 = defender spawn
	tiles: stringMap(`
		000000000000000000000000000000000000000000000000000000000000000000
		000000000000000000000000000000000000000000000000000000000000000000
		000000000000000000000000000000000000000000000000000000000000000000
		000110000000000000000000000000000000000000000000000000000000022000
		000110000000000000000000000000000000000000000000000000000000022000
		000110000000000000000000000000000000000000000000000000000000022000
		000110000000000000000000000000000000000000000000000000000000022000
		000110000000000000000000000000000000000000000000000000000000022000
		000110000000000000000000000000000000000000000000000000000000022000
		000110000000000000000000000000000000000000000000000000000000022000
		000110000000000000000000000000000000000000000000000000000000022000
		000110000000000000000000000000000000000000000333333333000000022000
		000110000000000000000000000000000000000000000333333333000000022000
		000110000000000000000000000000000000000000000333333333000000022000
		000110000000000000000000000000000000000000000333333333000000022000
		000110000000000000000000000000000000000000000333333333000000022000
		000110000000000000000000000000000000000000000333333333000000022000
		000110000000000000000000000000000000000000000333333333000000022000
		000110000000000000000000000000000000000000000333333333000000022000
		000110000000000000000000000000000000000000000333333333000000022000
		000110000000000000000000000000000000000000000000000000000000022000
		000110000000000000000000000000000000000000000000000000000000022000
		000110000000000000000000000000000000000000000000000000000000022000
		000110000000000000000000000000000000000000000000000000000000022000
		000110000000000000000000000000000000000000000000000000000000022000
		000110000000000000000000000000000000000000000000000000000000022000
		000110000000000000000000000000000000000000000000000000000000022000
		000110000000000000000000000000000000000000000000000000000000022000
		000110000000000000000000000000000000000000000000000000000000022000
		000000000000000000000000000000000000000000000000000000000000000000
		000000000000000000000000000000000000000000000000000000000000000000
		000000000000000000000000000000000000000000000000000000000000000000
    `),
};
