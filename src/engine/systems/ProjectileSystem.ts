import { System } from "../../core/System";
import { MoveTarget } from "../components/MoveTarget";
import type { Sprite } from "../entities/widgets/Sprite";
import type { Projectile } from "../entities/widgets/sprites/Projectile";
import { isProjectile } from "../typeguards";
import { distanceBetweenPoints } from "../util/tweenPoints";

export class ProjectileSystem extends System<Projectile> {
	// Conditions are static
	readonly pure = true;

	test(entity: Sprite): entity is Projectile {
		return isProjectile(entity);
	}

	update(projectile: Projectile): void {
		if (MoveTarget.has(projectile)) return;

		projectile.owner
			.getEnemySprites()
			.filter((s) => Number.isFinite(s.health))
			.forEach((target) => {
				if (
					distanceBetweenPoints(
						target.position,
						projectile.position,
					) > projectile.splash
				)
					return;

				const actualDamage = target.damage(projectile.damageAmount);
				if (projectile.onDamage)
					projectile.onDamage(
						target,
						actualDamage,
						projectile.producer,
						projectile,
					);
			});

		projectile.remove();
	}
}
