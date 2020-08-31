import { Component } from "../core/Component";
import { Entity } from "../core/Entity";
import { Sprite } from "../entities/sprites/Sprite";
import { Point } from "../pathing/PathingMap";

export class Position extends Component<
	[number, number, { zOffset: number; flyHeight: number }]
> {
	protected static map = new WeakMap<Entity, Position>();
	static get(entity: Entity): Position | undefined {
		return this.map.get(entity);
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
}

export const getEntityXY = (entity: Entity): Point | undefined => {
	const position = Position.get(entity);
	if (position) return { x: position.x, y: position.y };

	if (Sprite.isSprite(entity))
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
