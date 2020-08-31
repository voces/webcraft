import { AttackTarget, AttackTargetManager } from "../components/AttackTarget";
import { System } from "../core/System";
import { Unit } from "../entities/sprites/Unit";
import { Sprite } from "../entities/sprites/Sprite";
import { isInAttackRange } from "../entities/sprites/UnitApi";
import { MoveTargetManager } from "../components/MoveTarget";
import { DamageComponentManager } from "../components/DamageComponent";
import { MeshBuilderComponentManager } from "../components/graphics/MeshBuilderComponent";
import { AnimationManager, Animation } from "../components/graphics/Animation";

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

		// Target dead or invul
		if (
			attackTarget.target.health <= 0 ||
			attackTarget.target.invulnerable
		) {
			MoveTargetManager.delete(entity);
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

			if (
				attackTarget.target.health <= 0 ||
				attackTarget.target.invulnerable
			) {
				MoveTargetManager.delete(entity);
				AttackTargetManager.delete(entity);
			}
		} else weapon.projectile(attackTarget.target, entity);

		const MeshBuilderComponent = MeshBuilderComponentManager.get(entity);
		if (MeshBuilderComponent)
			AnimationManager.set(entity, new Animation(entity, "attack", 0.25));

		weapon.last = entity.round.lastUpdate;
	}
}
