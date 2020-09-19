import { Component } from "../../core/Component";
import { Entity } from "../../core/Entity";
import { whileReplacingComponent } from "../../core/util/flags";
import { Point } from "../pathing/PathingMap";
import { isEntity } from "../typeguards";

export class Position extends Component<
	[number, number, { zOffset: number; flyHeight: number }]
> {
	static setXY(entity: Entity, x: number, y: number): Position {
		return whileReplacingComponent(() => {
			const component = entity.get(Position)[0];
			if (component) entity.clear(this);
			return new Position(entity, x, y, {
				zOffset: component?.zOffset,
				flyHeight: component?.flyHeight,
			});
		});
	}

	readonly x!: number;
	readonly y!: number;
	readonly zOffset!: number;
	readonly flyHeight!: number;

	constructor(
		entity: Entity,
		x: number,
		y: number,
		{
			zOffset = 0,
			flyHeight = 0,
		}: { zOffset?: number; flyHeight?: number } = {},
	) {
		super(entity, x, y, { zOffset, flyHeight });
	}

	protected initialize(
		x: number,
		y: number,
		{ zOffset, flyHeight }: { zOffset: number; flyHeight: number },
	): void {
		(this.x as number) = x;
		(this.y as number) = y;
		(this.zOffset as number) = zOffset;
		(this.flyHeight as number) = flyHeight;
	}

	setXY(x: number, y: number): Position {
		return Position.setXY(this.entity, x, y);
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hasPositionProp = (entity: any): entity is { position: Point } =>
	entity &&
	typeof entity === "object" &&
	entity.position &&
	typeof entity.position === "object" &&
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
