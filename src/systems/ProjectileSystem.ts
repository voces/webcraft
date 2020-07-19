import { System } from "../core/System.js";
import { Sprite } from "../sprites/Sprite.js";
import { MoveTargetManager } from "../components/MoveTarget.js";
import { distanceBetweenPoints } from "../util/tweenPoints.js";
import { Projectile } from "../sprites/projectiles/Projectile.js";

export class ProjectileSystem extends System<Projectile> {
	test(entity: Sprite): entity is Projectile {
		return entity instanceof Projectile;
	}

	update(projectile: Projectile): void {
		if (MoveTargetManager.has(projectile)) return;

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
