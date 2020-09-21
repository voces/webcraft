import { System } from "../../core/System";
import { MoveTarget } from "../components/MoveTarget";
import { Sprite } from "../entities/widgets/Sprite";
import { currentGame } from "../gameContext";
import { PathingMap, Point } from "../pathing/PathingMap";
import { isSprite } from "../typeguards";

const withoutTarget = <A>(
	pathingMap: PathingMap,
	target: Point | Sprite,
	fn: () => A,
): A => {
	if (isSprite(target)) return pathingMap.withoutEntity(target, fn);

	return fn();
};

type MovingSprite = Sprite & {
	speed: number;
};

export class MoveSystem extends System<MovingSprite> {
	static components = [MoveTarget];

	test(entity: Sprite & { speed?: number }): entity is MovingSprite {
		return (
			entity.has(MoveTarget) &&
			typeof entity.speed === "number" &&
			entity.speed > 0
		);
	}

	update(
		entity: MovingSprite,
		delta: number,
		time: number,
		retry = true,
	): void {
		const moveTarget = entity.get(MoveTarget)[0];
		if (!moveTarget) return this.remove(entity);

		const pathingMap = currentGame().pathingMap;

		// Move
		moveTarget.progress += delta * entity.speed;
		const { x, y } = moveTarget.path(moveTarget.progress);

		// Validate data
		if (isNaN(x) || isNaN(y)) {
			entity.clear(moveTarget);
			throw new Error(`Returning NaN location x=${x} y=${y}`);
		}

		// Update self
		const pathable = pathingMap.pathable(entity, x, y);
		if (pathable) entity.position.setXY(x, y);

		// We've reached the end
		if (moveTarget.path.distance < moveTarget.progress)
			entity.clear(moveTarget);

		// Recheck path, start a new one periodically or if check fails
		if (
			entity.requiresPathing &&
			(!pathable ||
				moveTarget.ticks % 5 === 0 ||
				!withoutTarget(pathingMap, moveTarget.target, () =>
					pathingMap.recheck(
						moveTarget.path.points,
						entity,
						delta * entity.speed * 6,
					),
				))
		) {
			moveTarget.recalc();

			// No move to go!
			if (moveTarget.path.distance === 0) entity.clear(moveTarget);

			if (!pathable && retry) this.update(entity, delta, time, false);
		}
	}
}
