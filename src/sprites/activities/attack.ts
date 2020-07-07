import { WORLD_TO_GRAPHICS_RATIO } from "../../constants.js";
import { tweenPoints, PathTweener } from "../../util/tweenPoints.js";
import { Unit } from "../Unit.js";
import { Sprite } from "../Sprite.js";
import { Point } from "../../pathing/PathingMap.js";

const isInRange = (attacker: Unit, target: Sprite) => {
	if (!attacker.weapon) return false;

	const distanceToTarget = Math.sqrt(
		(target.x - attacker.x) ** 2 + (target.y - attacker.y) ** 2,
	);
	return (
		distanceToTarget <
		attacker.weapon.range + attacker.radius + target.radius
	);
};

export const attack = (attacker: Unit, target: Sprite): void => {
	if (!attacker.weapon) return;

	const pathingMap = attacker.round.pathingMap;
	let path: PathTweener;
	let updateProgress = 0;
	let updateTicks = 0;
	let renderProgress = 0;
	let renderedPosition: Point | undefined;

	// Attacker can't move and target is not in range; do nothing
	if (!attacker.speed && !isInRange(attacker, target)) return;

	attacker.activity = {
		toJSON: () => ({
			name: "attack",
			target: target.id,
			ticks: updateTicks,
		}),
	};

	if (attacker.speed) {
		path = tweenPoints(
			pathingMap.withoutEntity(target, () =>
				pathingMap.path(attacker, target),
			),
		);

		// We only render the attacker moving
		attacker.activity.render = (delta) => {
			if (!attacker.weapon) return;

			const range =
				attacker.weapon.range + attacker.radius + target.radius;
			const realDistanceToTarget = Math.sqrt(
				(target.x - attacker.x) ** 2 + (target.y - attacker.y) ** 2,
			);
			// If we're attacking, we don't need to animate movement
			if (realDistanceToTarget < range) return;

			// If we're rendered as near enough, no need to animate movement
			const pos = renderedPosition || attacker;
			const renderedDistanceToTarget = Math.sqrt(
				(target.x - pos.x) ** 2 + (target.y - pos.y) ** 2,
			);
			if (renderedDistanceToTarget < range) return;

			renderProgress += delta * attacker.speed;
			let { x, y } = path(renderProgress);

			const distanceToTarget = Math.sqrt(
				(target.x - x) ** 2 + (target.y - y) ** 2,
			);
			if (distanceToTarget < range) {
				const newPoint = path.radialStepBack(range);
				x = newPoint.x;
				y = newPoint.y;
			}

			renderedPosition = { x, y };
			if (attacker.html?.htmlElement) {
				attacker.html.htmlElement.style.left =
					(x - attacker.radius) * WORLD_TO_GRAPHICS_RATIO + "px";
				attacker.html.htmlElement.style.top =
					(y - attacker.radius) * WORLD_TO_GRAPHICS_RATIO + "px";
			}
		};
	}

	const update = (delta: number, retry = true) => {
		if (!attacker.weapon) {
			attacker.activity = undefined;
			return;
		}

		if (target.health <= 0) {
			attacker.activity = undefined;
			return;
		}

		updateTicks++;

		let x = attacker.x;
		let y = attacker.y;
		const stepProgress = delta * attacker.speed;
		updateProgress += stepProgress;

		if (attacker.speed) {
			const newPoint = path(updateProgress);
			x = newPoint.x;
			y = newPoint.y;
		}

		// Within range to attack
		if (isInRange(attacker, target)) {
			// Not on cooldown
			if (
				attacker.weapon.last + attacker.weapon.cooldown <
				attacker.round.lastUpdate
			) {
				if (attacker.weapon.projectile === "instant") {
					const damage = attacker.isIllusion
						? 0
						: attacker.weapon.damage;
					const actualDamage = target.damage(damage);
					if (attacker.weapon.onDamage)
						attacker.weapon.onDamage(
							target,
							actualDamage,
							attacker,
						);

					if (target.health <= 0) attacker.activity = undefined;
				} else attacker.weapon.projectile(target, attacker);

				if (attacker.html?.htmlElement)
					attacker.html.htmlElement.classList.add("attack");
				attacker.round.setTimeout(
					() =>
						attacker.html?.htmlElement?.classList.remove("attack"),
					0.25,
				);
				attacker.weapon.last = attacker.round.lastUpdate;
			}
		} else if (path && path.distance === 0) {
			attacker.activity = undefined;
			attacker.setPosition(x, y);

			renderedPosition = undefined;
		} else if (attacker.speed) {
			// Update self
			const pathable = pathingMap.pathable(attacker, x, y);
			if (pathable) attacker.setPosition(x, y);

			// Recheck path, start a new one periodically or if check fails
			if (
				!pathable ||
				updateTicks % 5 === 0 ||
				!pathingMap.withoutEntity(target, () =>
					pathingMap.recheck(
						path.points,
						attacker,
						delta * attacker.speed * 6,
					),
				)
			) {
				path = tweenPoints(
					pathingMap.withoutEntity(target, () =>
						pathingMap.path(attacker, target),
					),
				);

				updateProgress = 0;
				renderProgress = 0;
				renderedPosition = undefined;

				if (!pathable && retry) update(delta, false);
			}
		}
	};

	attacker.activity.update = update;
};
