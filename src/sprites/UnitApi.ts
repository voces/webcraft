import { Unit } from "./Unit.js";
import { Sprite } from "./Sprite.js";
import { DamageComponentManager } from "../components/DamageComponent.js";

export const isInAttackRange = (attacker: Unit, target: Sprite): boolean => {
	const damageComponent = DamageComponentManager.get(attacker);
	if (!damageComponent) return false;
	const weapon = damageComponent.weapons[0];

	const distanceToTarget = Math.sqrt(
		(target.position.x - attacker.position.x) ** 2 +
			(target.position.y - attacker.position.y) ** 2,
	);

	return distanceToTarget <= weapon.range + attacker.radius + target.radius;
};
