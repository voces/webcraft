import { System } from "../../core/System";
import { isInAttackRange } from "../api/UnitApi";
import { AttackTarget } from "../components/AttackTarget";
import type { Weapon } from "../components/DamageComponent";
import { DamageComponent } from "../components/DamageComponent";
import { Animation } from "../components/graphics/Animation";
import { MeshBuilderComponent } from "../components/graphics/MeshBuilderComponent";
import { MoveTarget } from "../components/MoveTarget";
import { Position } from "../components/Position";
import type { Sprite } from "../entities/widgets/Sprite";
import type { Unit } from "../entities/widgets/sprites/Unit";
import { TextTag } from "../entities/widgets/TextTag";
import { currentGame } from "../gameContext";
import { isUnit } from "../typeguards";

const doDamage = (entity: Unit, attackTarget: AttackTarget, weapon: Weapon) => {
	const isTargetInRange = isInAttackRange(entity, attackTarget.target, true);

	if (!isTargetInRange) {
		if (entity.has(Position))
			new TextTag({
				color: "red",
				text: "miss",
				x: entity.position.x,
				y: entity.position.y,
			});
		return;
	}

	const damage = entity.isIllusion ? 0 : weapon.damage;
	const actualDamage = attackTarget.target.damage(damage);
	if (weapon.onDamage)
		weapon.onDamage(attackTarget.target, actualDamage, entity);

	if (attackTarget.target.health <= 0 || attackTarget.target.invulnerable) {
		MoveTarget.clear(entity);
		AttackTarget.clear(entity);
	}
};

export class AttackSystem extends System<Unit> {
	static components = [AttackTarget];
	readonly pure = false;

	test(entity: Sprite): entity is Unit {
		return AttackTarget.has(entity) && isUnit(entity);
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
		if (!isTargetInRange && !MoveTarget.has(entity) && !weapon.swinging) {
			AttackTarget.clear(entity);
			return;
		}

		const lastUpdate = currentGame().lastUpdate;

		// Not within range and not in cooldown
		if (!isTargetInRange || weapon.last + weapon.cooldown > lastUpdate)
			return;

		if (weapon.projectile === "instant")
			doDamage(entity, attackTarget, weapon);
		else if (weapon.projectile === "swing") {
			weapon.swinging = true;

			const oldMoveTarget = entity.get(MoveTarget)[0];
			if (oldMoveTarget) entity.clear(oldMoveTarget);

			currentGame().setTimeout(() => {
				weapon.swinging = false;

				// Target could have died while we're swinging
				if (
					!attackTarget.target.isAlive ||
					attackTarget.target.invulnerable
				) {
					AttackTarget.clear(entity);
					return;
				}

				if (oldMoveTarget)
					new MoveTarget({ entity, target: oldMoveTarget.entity });

				doDamage(entity, attackTarget, weapon);
			}, weapon.damagePoint ?? 0);
		} else weapon.projectile(attackTarget.target, entity);

		const meshBuilderComponent = entity.get(MeshBuilderComponent)[0];
		if (meshBuilderComponent) new Animation(entity, "attack", 0.75);

		weapon.last = lastUpdate;
	}
}
