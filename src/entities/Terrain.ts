import {
	Terrain as TerrainMesh,
	LordaeronSummerDarkGrass,
	LordaeronSummerRock,
	LordaeronSummerGrass,
	LordaeronSummerDirt,
	LordaeronSummerDirtCliff,
} from "notextures";
import { SceneObjectComponent } from "../components/graphics/SceneObjectComponent";
import { Arena } from "../arenas/types";
import { Group, Vector3 } from "three";
import { orientation } from "../pathing/math";

const isRamp = (x: number, y: number, layers: number[][]) => {
	const cur = layers[y]?.[x];
	if (cur === undefined) return false;

	const checks = [
		layers[y - 1]?.[x] - cur,
		layers[y + 1]?.[x] - cur,
		layers[y]?.[x + 1] - cur,
		layers[y]?.[x - 1] - cur,
	];

	if (checks.every((v) => v === 0)) return false;
	if (checks.some((v) => v > 1)) return false;
	if (!checks.some((v) => v === 1)) return false;

	return true;
};

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

type TVector = TerrainMesh["vertices"][number][number][number];

export class Terrain {
	private group: Group;
	private height: number;
	id = "terrain";
	constructor(arena: Arena) {
		const vertexZeroes = Array(arena.layers[0].length + 1).fill(
			new Array(arena.layers.length + 1),
		);
		this.height = arena.layers.length;
		const mesh = new TerrainMesh({
			masks: {
				height: vertexZeroes,
				cliff: arena.layers.map((r, y) =>
					r.map((v, x) => {
						if (isRamp(x, y, arena.layers)) return "r";
						if (v > 1) return 2;
						return v;
					}),
				),
				groundTile: arena.pathing,
				cliffTile: arena.layers.map((r) => r.map(() => 4)),
				water: arena.layers.map((r) => r.map(() => 0)),
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
				LordaeronSummerDirt,
				LordaeronSummerDirtCliff,
			],
			size: {
				width: arena.layers[0].length,
				height: this.height,
			},
		});
		new SceneObjectComponent(this, mesh);
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
		const terrain = SceneObjectComponent.get(this)!.object as TerrainMesh;
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
