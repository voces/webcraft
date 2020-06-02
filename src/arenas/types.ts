
export interface InternalArena {
	name: string,
	layers: number[][],
	tiles: number[][],
}

export interface Arena extends InternalArena {
	layers: number[][];
    pathing: number[][];
}