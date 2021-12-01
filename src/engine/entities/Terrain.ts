import {
	LordaeronSummerDarkGrass,
	LordaeronSummerDirtCliff,
	LordaeronSummerGrass,
	LordaeronSummerRock,
	Terrain as TerrainGroup,
} from "notextures";
import type { CliffMask } from "notextures/dist/objects/Terrain/Terrain";
import type { Vector3 } from "three";

import { Entity } from "../../core/Entity";
import { ThreeObjectComponent } from "../components/graphics/ThreeObjectComponent";
import { orientation } from "../pathing/math";

/**
 * Returns the z coordinate of point (x, y) on the plane defined by (a, b, c)
 */
export const interpolateZ = (
	[a, b, c]: readonly [Vector3, Vector3, Vector3],
	x: number,
	y: number,
): number => {
	// Solution: https://math.stackexchange.com/a/28050 and
	// https://math.stackexchange.com/a/28046
	const v1 = a.clone().sub(b);
	const v2 = a.clone().sub(c);
	const n = v1.cross(v2);
	const k = n.x * a.x + n.y * a.y + n.z * a.z;

	return (k - n.x * x - n.y * y) / n.z;
};

export class Terrain extends Entity {
	readonly isTerrain = true;
	private group: TerrainGroup;
	private height: number;
	constructor(opts: {
		width: number;
		height: number;
		cliffs: CliffMask;
		pathing: number[][];
		heightMask?: number[][];
		waterMask?: number[][];
		waterHeightMask?: number[][];
		waterHeight?: number;
		tiles?: { color: string }[];
	}) {
		super("TERRAIN");
		const vertexZeroes = Array(opts.height + 1).fill(
			new Array(opts.width + 1).fill(0),
		);
		this.height = opts.height;
		const waterHeightMask = opts.waterHeightMask ?? vertexZeroes;
		const group = new TerrainGroup({
			masks: {
				height: opts.heightMask ?? vertexZeroes,
				cliff: opts.cliffs,
				groundTile: opts.pathing,
				cliffTile: opts.cliffs.map((r) => r.map(() => 4)),
				water:
					opts.waterMask ??
					opts.cliffs.map((r, y) =>
						r.map((v, x) => (v <= waterHeightMask[y][x] ? 1 : 0)),
					),
				waterHeight: opts.waterHeightMask ?? vertexZeroes,
			},
			offset: {
				x: 0,
				y: this.height,
				z: 0,
			},
			tiles: opts.tiles ?? [
				LordaeronSummerDarkGrass,
				LordaeronSummerGrass,
				LordaeronSummerRock,
				LordaeronSummerGrass,
				LordaeronSummerDirtCliff,
			],
			size: {
				width: opts.width,
				height: opts.height,
			},
		});
		new ThreeObjectComponent(this, group);
		this.group = group;
	}

	private lastGroundHeight?: {
		x: number;
		y: number;
		height: number;
	};
	groundHeight(x: number, y: number): number {
		if (this.lastGroundHeight)
			if (this.lastGroundHeight.x === x && this.lastGroundHeight.y === y)
				return this.lastGroundHeight.height;

		const pt = { x, y };
		let triangle: [Vector3, Vector3, Vector3];
		const faces =
			this.group.groundFaces[Math.floor(this.height - y)]?.[
				Math.floor(x)
			];
		if (!faces) return 0;

		{
			const v1 = faces[0].a;
			const v2 = faces[0].b;
			const v3 = faces[0].c;

			const side1 = Math.abs(orientation(pt, v1, v2)) < 1e-7;
			const side2 = Math.abs(orientation(pt, v2, v3)) < 1e-7;
			const side3 = Math.abs(orientation(pt, v3, v1)) < 1e-7;

			triangle =
				side1 === side2 && side2 === side3
					? [v1, v2, v3]
					: [faces[1].a, faces[1].b, faces[1].c];
		}

		const height = interpolateZ(triangle, x, -this.height + y);

		this.lastGroundHeight = { x, y, height };

		return height;
	}
}

export type TerrainInterface = {
	isTerrain: true;
	groundHeight: Terrain["groundHeight"];
};
