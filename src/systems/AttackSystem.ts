import {
	AttackTarget,
	AttackTargetManager,
} from "../components/AttackTarget.js";
import { System } from "../core/System.js";
import { Unit } from "../sprites/Unit.js";
import { Sprite } from "../sprites/Sprite.js";
import { isInAttackRange } from "../sprites/UnitApi.js";
import { MoveTargetManager } from "../components/MoveTarget.js";
import { DamageComponentManager } from "../components/DamageComponent.js";

export class AttackSystem extends System<Unit> {
	static components = [AttackTarget];

	test(entity: Sprite): entity is Unit {
		return AttackTargetManager.has(entity) && entity instanceof Unit;
	}

	update(entity: Unit): void {
		const damageComponent = DamageComponentManager.get(entity);
		if (!damageComponent) {
			AttackTargetManager.delete(entity);
			return;
		}
		const weapon = damageComponent.weapons[0];

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
			weapon.last + weapon.cooldown > entity.round.lastUpdate
		)
			return;

		if (weapon.projectile === "instant") {
			const damage = entity.isIllusion ? 0 : weapon.damage;
			const actualDamage = attackTarget.target.damage(damage);
			if (weapon.onDamage)
				weapon.onDamage(attackTarget.target, actualDamage, entity);

			if (attackTarget.target.health <= 0)
				AttackTargetManager.delete(entity);
		} else weapon.projectile(attackTarget.target, entity);

		if (entity.html?.htmlElement)
			entity.html.htmlElement.classList.add("attack");
		entity.round.setTimeout(
			() => entity.html?.htmlElement?.classList.remove("attack"),
			0.25,
		);
		weapon.last = entity.round.lastUpdate;
	}
}
