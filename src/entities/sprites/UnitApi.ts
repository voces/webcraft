import { Unit } from "./Unit";
import { Sprite } from "./Sprite";
import { DamageComponentManager } from "../../components/DamageComponent";

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
