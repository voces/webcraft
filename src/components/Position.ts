import { Component } from "../core/Component";
import { Entity } from "../core/Entity";
import { Point } from "../pathing/PathingMap";

export class Position extends Component<
	[number, number, { zOffset: number; flyHeight: number }]
> {
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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hasPositionProp = (entity: any): entity is { position: Point } =>
	entity &&
	typeof entity === "object" &&
	entity.position &&
	typeof entity.position === "object" &&
	typeof entity.position.x === "number" &&
	typeof entity.position.y === "number";

export const getEntityXY = (entity: Entity): Point | undefined => {
	const position = entity.get(Position)[0];
	if (position) return { x: position.x, y: position.y };

	if (hasPositionProp(entity))
		return { x: entity.position.x, y: entity.position.y };

	return;
};

export const getEntityX = (entity: Entity): number | undefined => {
	const xy = getEntityXY(entity);
	if (xy) return xy.x;
};

export const getEntityY = (entity: Entity): number | undefined => {
	const xy = getEntityXY(entity);
	if (xy) return xy.y;
};
