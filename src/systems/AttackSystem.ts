import {
	AttackTarget,
	AttackTargetManager,
} from "../components/AttackTarget.js";
import { System } from "../core/System.js";
import { Unit } from "../sprites/Unit.js";
import { Sprite } from "../sprites/Sprite.js";
import { isInAttackRange } from "../sprites/UnitApi.js";
import { MoveTargetManager } from "../components/MoveTarget.js";

export class AttackSystem extends System<Unit> {
	static components = [AttackTarget];

	test(entity: Sprite): entity is Unit {
		return AttackTargetManager.has(entity) && entity instanceof Unit;
	}

	update(entity: Unit): void {
		if (!entity.weapon) {
			AttackTargetManager.delete(entity);
			return;
		}

		const attackTarget = AttackTargetManager.get(entity);

		if (!attackTarget) return this.remove(entity);

		// Target dead
		if (attackTarget.target.health <= 0) {
			AttackTargetManager.delete(entity);
			return;
		}

		const isTargetInRange = isInAttackRange(entity, attackTarget.target);

		// We're not moving towards the target and it's not close enough
		if (!isTargetInRange && !MoveTargetManager.has(entity)) {
			AttackTargetManager.delete(entity);
			return;
		}

		// Not within range and not in cooldown
		if (
			!isTargetInRange ||
			entity.weapon.last + entity.weapon.cooldown >
				entity.round.lastUpdate
		)
			return;

		if (entity.weapon.projectile === "instant") {
			const damage = entity.isIllusion ? 0 : entity.weapon.damage;
			const actualDamage = attackTarget.target.damage(damage);
			if (entity.weapon.onDamage)
				entity.weapon.onDamage(
					attackTarget.target,
					actualDamage,
					entity,
				);

			if (attackTarget.target.health <= 0)
				AttackTargetManager.delete(entity);
		} else entity.weapon.projectile(attackTarget.target, entity);

		if (entity.html?.htmlElement)
			entity.html.htmlElement.classList.add("attack");
		entity.round.setTimeout(
			() => entity.html?.htmlElement?.classList.remove("attack"),
			0.25,
		);
		entity.weapon.last = entity.round.lastUpdate;
	}
}
