import { Entity } from "../../core/Entity";
import { System } from "../../core/System";
import { PathingComponent } from "../components/PathingComponent";
import { PathingEntity } from "../components/PathingEntity";
import { hasPositionProp, Position } from "../components/Position";
import type { Point } from "../pathing/PathingMap";
import { PathingMap } from "../pathing/PathingMap";
import { isObstruction, isSprite } from "../typeguards";

type PathingMapEntity = Parameters<PathingMap["path"]>[0];

const isPathingMapEntity = (
	entity: Entity | PathingMapEntity,
): entity is PathingMapEntity => {
	// All PathingMapEntities require collisionRadius
	if (
		!("collisionRadius" in entity) ||
		typeof entity.collisionRadius !== "number"
	)
		return false;

	// PathingMapEntities can either have position or x/y
	if (hasPositionProp(entity)) return true;
	if (!("x" in entity) || typeof entity.x !== "number") return false;
	if (!("y" in entity) || typeof entity.y !== "number") return false;

	return true;
};

export class PathingSystem extends System {
	static components = [Position, PathingComponent];

	readonly pure = true;
	readonly widthWorld: number;
	readonly heightWorld: number;
	readonly layer: PathingMap["layer"];
	readonly grid: PathingMap["grid"];

	private readonly componentMap = new Map<Entity, PathingEntity>();
	private readonly pathingMap: PathingMap;

	constructor(terrain: ConstructorParameters<typeof PathingMap>[0]) {
		super();
		this.pathingMap = new PathingMap(terrain);
		this.widthWorld = this.pathingMap.widthWorld;
		this.heightWorld = this.pathingMap.heightWorld;
		this.layer = this.pathingMap.layer.bind(this.pathingMap);
		this.grid = this.pathingMap.grid;
	}

	test(entity: Entity): entity is Entity {
		return Position.has(entity) && PathingComponent.has(entity);
	}

	onAddEntity(entity: Entity): void {
		let sprite;
		if (isSprite(entity)) sprite = entity;

		let obstruction;
		if (isObstruction(entity)) obstruction = entity;

		const pathingEntity =
			entity.get(PathingEntity)[0] ??
			new PathingEntity(entity, {
				collisionRadius: sprite?.collisionRadius ?? 0,
				blocksPathing: sprite?.blocksPathing ?? 0,
				blocksTilemap: obstruction?.blocksTilemap,
				requiresPathing: sprite?.requiresPathing ?? 0,
				requiresTilemap: obstruction?.requiresTilemap,
				structure: obstruction?.structure ?? false,
				x: () => entity.get(Position)[0]!.x,
				y: () => entity.get(Position)[0]!.y,
			});
		this.componentMap.set(entity, pathingEntity);
		this.pathingMap.addEntity(pathingEntity);
	}

	private getPathingMapEntity(
		entity: Entity | PathingMapEntity,
		requirePathingEntity = true,
	): PathingMapEntity {
		const pathingEntity =
			entity instanceof Entity
				? entity.get(PathingEntity)[0] ?? this.componentMap.get(entity)
				: undefined;

		if (pathingEntity) return pathingEntity;

		if (requirePathingEntity)
			throw new Error(
				"Expected an entity with a PathingEntity component",
			);

		if (isPathingMapEntity(entity)) return entity;

		throw new Error(
			"Expected an entity with a PathingEntity component or to be a PathingMapEntity",
		);
	}

	onRemoveEntity(entity: Entity): void {
		const pathingEntities = entity.get(PathingEntity);
		for (const pathingEntity of pathingEntities) {
			if (!pathingEntity) continue;
			this.pathingMap.removeEntity(pathingEntity);
		}

		const pathingEntity = this.componentMap.get(entity);
		if (pathingEntity) this.pathingMap.removeEntity(pathingEntity);

		this.componentMap.delete(entity);
	}

	pathable(entity: Entity, x: number, y: number): boolean {
		return this.pathingMap.pathable(
			this.getPathingMapEntity(entity, false),
			x,
			y,
		);
	}

	nearestSpiralPathing(
		xWorld: number,
		yWorld: number,
		entity: Entity,
		layer?: number,
	): Point {
		return this.pathingMap.nearestSpiralPathing(
			xWorld,
			yWorld,
			this.getPathingMapEntity(entity, false),
			layer,
		);
	}

	path(
		entity: Entity | PathingMapEntity,
		target: Point,
		start?: Point,
	): Point[] {
		return this.pathingMap.path(
			this.getPathingMapEntity(entity, false),
			target,
			start,
		);
	}

	withoutEntity<A>(entity: Entity, fn: () => A): A {
		return this.pathingMap.withoutEntity(
			this.getPathingMapEntity(entity),
			fn,
		);
	}

	recheck(
		path: Point[],
		entity: Entity,
		amount = Infinity,
		offset = 0,
	): boolean {
		return this.pathingMap.recheck(
			path,
			this.getPathingMapEntity(entity),
			amount,
			offset,
		);
	}
}
