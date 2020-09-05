export interface InternalArena {
	name: string;
	cliffs: (number | "r")[][];
	tiles: number[][];
}

export interface Arena extends InternalArena {
	cliffs: (number | "r")[][];
	pathing: number[][];
	width: number;
	height: number;
	pathingCliffs: number[][];
}
