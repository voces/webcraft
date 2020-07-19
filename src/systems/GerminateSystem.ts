import { System } from "../core/System.js";
import { Sprite } from "../sprites/Sprite.js";
import {
	GerminateComponent,
	GerminateComponentManager,
} from "../components/GerminateComponent.js";

type GerminatingEntity = Sprite & {
	buildTime: number;
};

export class GerminateSystem extends System<GerminatingEntity> {
	static components = [GerminateComponent];

	test(entity: Sprite & { buildTime?: number }): entity is GerminatingEntity {
		return (
			GerminateComponentManager.has(entity) &&
			typeof entity.buildTime === "number"
		);
	}

	update(entity: GerminatingEntity, delta: number): void {
		const germinateComponent = GerminateComponentManager.get(entity);
		if (!germinateComponent) return;

		// Move up progress
		const newProgress = Math.min(
			1,
			germinateComponent.progress + delta / entity.buildTime,
		);
		const deltaProgress = newProgress - germinateComponent.progress;
		germinateComponent.progress = newProgress;

		// Increase health
		entity.health = Math.min(
			entity.health + deltaProgress * entity.maxHealth,
			entity.maxHealth,
		);

		// Remove the component if we're done
		if (newProgress === 1) GerminateComponentManager.delete(entity);
	}
}
