import { Point } from "../pathing/PathingMap.js";
import { Sprite } from "../sprites/Sprite.js";
import {
	PathTweener,
	tweenPoints,
	distanceBetweenPoints,
	shortenPath,
	calcAndTweenShortenedPath,
} from "../util/tweenPoints.js";
import { Component } from "../core/Component.js";
import { ComponentManager } from "../core/ComponentManager.js";

export class MoveTarget extends Component {
	// The entity with the MoveTarget component.
	target: Point | Sprite;

	path: PathTweener;

	// How clost to the target we're trying to get. This is a radial distance.
	distance: number;

	// Number of update ticks that have occured since the path was calculated.
	ticks = 0;

	/**
	 * How far along the path the entity has moved. This allows for accounting
	 * for unit speed changes.
	 */
	progress = 0;

	/**
	 * How far along the path the entity is rendered to have moved. This allows
	 * for accounting for unit speed changes.
	 */
	renderProgress = 0;

	constructor({
		entity,
		target,
		distance = 0,
		path,
	}: {
		entity: Sprite;
		target: Point | Sprite;
		distance?: number;
		path?: PathTweener;
	}) {
		super(entity);
		this.target = target;
		this.distance = distance;

		if (!path) path = calcAndTweenShortenedPath(entity, target, distance);
		else if (
			distance > 0 &&
			Math.abs(
				distanceBetweenPoints(
					path.target,
					Sprite.isSprite(target) ? target.position : target,
				) - distance,
			) < 1e-7
		)
			path = tweenPoints(shortenPath(path.points, distance));

		this.path = path;
	}

	recalc(): void {
		this.path = calcAndTweenShortenedPath(
			this.entity,
			this.target,
			this.distance,
		);

		this.progress = 0;
		this.renderProgress = 0;
		this.ticks = 0;
	}
}

export const MoveTargetManager = new ComponentManager<MoveTarget>(MoveTarget);
