import { Unit } from "./Unit.js";
import { Sprite } from "./Sprite.js";

export const isInAttackRange = (attacker: Unit, target: Sprite): boolean => {
	if (!attacker.weapon) return false;

	const distanceToTarget = Math.sqrt(
		(target.position.x - attacker.position.x) ** 2 +
			(target.position.y - attacker.position.y) ** 2,
	);

	return (
		distanceToTarget <=
		attacker.weapon.range + attacker.radius + target.radius
	);
};
