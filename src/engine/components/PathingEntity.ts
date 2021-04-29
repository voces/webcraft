import { Component } from "../../core/Component";
import type { Footprint, Point } from "../pathing/PathingMap";
import type { Mutable } from "../types";

type Props = {
	collisionRadius: number;
	blocksPathing?: number;
	blocksTilemap?: Footprint;
	pathing?: number;
	requiresPathing?: number;
	requiresTilemap?: Footprint;
	structure?: boolean;
	x: () => number;
	y: () => number;
};

export class PathingEntity extends Component<[Props]> {
	readonly derived = true;

	readonly collisionRadius!: number;
	readonly blocksPathing?: number;
	readonly blocksTilemap?: Footprint;
	readonly pathing?: number;
	readonly requiresPathing?: number;
	readonly requiresTilemap?: Footprint;
	readonly structure?: boolean;

	readonly xGet!: () => number;
	readonly yGet!: () => number;

	initialize({
		collisionRadius,
		blocksPathing,
		blocksTilemap,
		pathing,
		requiresPathing,
		requiresTilemap,
		structure,
		x,
		y,
	}: Props): void {
		const mutable: Mutable<PathingEntity> = this;
		mutable.collisionRadius = collisionRadius;
		mutable.blocksPathing = blocksPathing;
		mutable.blocksTilemap = blocksTilemap;
		mutable.pathing = pathing;
		mutable.requiresPathing = requiresPathing;
		mutable.requiresTilemap = requiresTilemap;
		mutable.structure = structure;
		mutable.xGet = x;
		mutable.yGet = y;
	}

	get position(): Point {
		return { x: this.xGet(), y: this.yGet() };
	}
}
