import { AttackTarget } from "../components/AttackTarget";
import { System } from "../../core/System";
import { Unit } from "../../entities/sprites/Unit";
import { Sprite } from "../../entities/sprites/Sprite";
import { isInAttackRange } from "../../entities/sprites/UnitApi";
import { Animation } from "../components/graphics/Animation";
import { DamageComponent } from "../components/DamageComponent";
import { MoveTarget } from "../components/MoveTarget";
import { MeshBuilderComponent } from "../components/graphics/MeshBuilderComponent";
import { currentGame } from "../gameContext";

export class AttackSystem extends System<Unit> {
	static components = [AttackTarget];

	test(entity: Sprite): entity is Unit {
		return AttackTarget.has(entity) && entity instanceof Unit;
	}

	update(entity: Unit): void {
		const damageComponent = entity.get(DamageComponent)[0];
		if (!damageComponent) {
			AttackTarget.clear(entity);
			return;
		}
		const weapon = damageComponent.weapons[0];

		const attackTarget = entity.get(AttackTarget)[0];

		if (!attackTarget) return this.remove(entity);

		// Target dead or invul
		if (
			attackTarget.target.health <= 0 ||
			attackTarget.target.invulnerable
		) {
			MoveTarget.clear(entity);
			AttackTarget.clear(entity);
			return;
		}

		const isTargetInRange = isInAttackRange(entity, attackTarget.target);

		// We're not moving towards the target and it's not close enough
		if (!isTargetInRange && !MoveTarget.has(entity)) {
			AttackTarget.clear(entity);
			return;
		}

		const lastUpdate = currentGame().lastUpdate;

		// Not within range and not in cooldown
		if (!isTargetInRange || weapon.last + weapon.cooldown > lastUpdate)
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
				MoveTarget.clear(entity);
				AttackTarget.clear(entity);
			}
		} else weapon.projectile(attackTarget.target, entity);

		const meshBuilderComponent = entity.get(MeshBuilderComponent)[0];
		if (meshBuilderComponent) new Animation(entity, "attack", 0.25);

		weapon.last = lastUpdate;
	}
}
