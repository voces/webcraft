import {
	LordaeronSummerDarkGrass,
	LordaeronSummerDirtCliff,
	LordaeronSummerGrass,
	LordaeronSummerRock,
	Terrain as TerrainMesh,
} from "notextures";
import { CliffMask } from "notextures/dist/objects/Terrain/Terrain";
import { Group, Vector3 } from "three";

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
	private group: Group;
	private height: number;
	constructor(arena: {
		width: number;
		height: number;
		cliffs: CliffMask;
		pathing: number[][];
	}) {
		super("TERRAIN");
		const vertexZeroes = Array(arena.height + 1).fill(
			new Array(arena.width + 1).fill(0),
		);
		this.height = arena.height;
		const mesh = new TerrainMesh({
			masks: {
				height: vertexZeroes,
				cliff: arena.cliffs,
				groundTile: arena.pathing,
				cliffTile: arena.cliffs.map((r) => r.map(() => 4)),
				water: arena.cliffs.map((r) => r.map((v) => (v === 0 ? 1 : 0))),
				waterHeight: vertexZeroes,
			},
			offset: {
				x: 0,
				y: this.height,
				z: 0,
			},
			tiles: [
				LordaeronSummerDarkGrass,
				LordaeronSummerGrass,
				LordaeronSummerRock,
				LordaeronSummerGrass,
				LordaeronSummerDirtCliff,
			],
			size: {
				width: arena.width,
				height: arena.height,
			},
		});
		new ThreeObjectComponent(this, mesh);
		this.group = mesh;
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
		const terrain = this.get(ThreeObjectComponent)[0]!
			.object as TerrainMesh;
		const geometry = terrain.ground;
		const faces =
			terrain.groundFaces[Math.floor(this.height - y)]?.[Math.floor(x)];
		if (!faces) return 0;

		{
			const v1 = geometry.vertices[faces[0].a];
			const v2 = geometry.vertices[faces[0].b];
			const v3 = geometry.vertices[faces[0].c];

			const side1 = Math.abs(orientation(pt, v1, v2)) < 1e-7;
			const side2 = Math.abs(orientation(pt, v2, v3)) < 1e-7;
			const side3 = Math.abs(orientation(pt, v3, v1)) < 1e-7;

			triangle =
				side1 === side2 && side2 === side3
					? [v1, v2, v3]
					: [
							geometry.vertices[faces[1].a],
							geometry.vertices[faces[1].b],
							geometry.vertices[faces[1].c],
					  ];
		}

		const height = interpolateZ(triangle, x, y);

		this.lastGroundHeight = { x, y, height };

		return height;
	}
}
