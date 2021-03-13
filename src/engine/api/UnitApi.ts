import { DamageComponent } from "../components/DamageComponent";
import type { Widget } from "../entities/Widget";
import type { Unit } from "../entities/widgets/sprites/Unit";
import { isUnit } from "../typeguards";

export const isInAttackRange = (
	attacker: Unit,
	target: Widget,
	includeRangeMotionBuffer = false,
): boolean => {
	const damageComponent = attacker.get(DamageComponent)[0];
	if (!damageComponent) return false;
	const weapon = damageComponent.weapons[0];

	const distanceToTarget = Math.sqrt(
		(target.position.x - attacker.position.x) ** 2 +
			(target.position.y - attacker.position.y) ** 2,
	);
	return (
		distanceToTarget <=
		weapon.range +
			attacker.collisionRadius +
			(isUnit(target) ? target.collisionRadius : 0) +
			(includeRangeMotionBuffer ? weapon.rangeMotionBuffer ?? 0 : 0)
	);
};
