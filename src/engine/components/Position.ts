import { Component } from "../../core/Component";
import type { Entity } from "../../core/Entity";
import { whileReplacingComponent } from "../../core/util/flags";
import type { Point } from "../pathing/PathingMap";
import { isEntity } from "../typeguards";
import type { Mutable } from "../types";
import { isObject } from "../types";

export class Position extends Component<[number, number, { zOffset: number }]> {
	static argMap = ["x", "y"];

	static setXY(
		entity: Entity,
		x: number,
		y: number,
		zOffset?: number,
	): Position {
		return whileReplacingComponent(() => {
			const component = entity.get(Position)[0];
			if (component) entity.clear(this);
			return new Position(entity, x, y, {
				zOffset: zOffset ?? component?.zOffset,
			});
		});
	}

	readonly x!: number;
	readonly y!: number;
	readonly zOffset!: number;

	constructor(
		entity: Entity,
		x: number,
		y: number,
		{ zOffset = 0 }: { zOffset?: number } = {},
	) {
		super(entity, x, y, { zOffset });
	}

	protected initialize(
		x: number,
		y: number,
		{ zOffset }: { zOffset: number },
	): void {
		const mutable: Mutable<Position> = this;
		mutable.x = x;
		mutable.y = y;
		mutable.zOffset = zOffset;
	}

	setXY(x: number, y: number, zOffset?: number): Position {
		return Position.setXY(this.entity, x, y, zOffset);
	}
}

export const hasPositionProp = (
	entity: unknown,
): entity is { position: Point } =>
	isObject(entity) &&
	isObject(entity.position) &&
	typeof entity.position.x === "number" &&
	typeof entity.position.y === "number";

export const getXY = (entity: Entity | Point): Point => {
	if (isEntity(entity)) {
		const position = entity.get(Position)[0];
		if (position) return { x: position.x, y: position.y };
	}

	if (hasPositionProp(entity))
		return { x: entity.position.x, y: entity.position.y };

	if (
		"x" in entity &&
		typeof entity.x === "number" &&
		typeof entity.y === "number"
	)
		return { x: entity.x, y: entity.y };

	throw new Error("Could not get XY from object");
};

export const getX = (entity: Entity): number => {
	const xy = getXY(entity);
	return xy.x;
};

export const getY = (entity: Entity): number => {
	const xy = getXY(entity);
	return xy.y;
};
