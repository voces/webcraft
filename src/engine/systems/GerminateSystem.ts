import { System } from "../../core/System";
import { GerminateComponent } from "../components/GerminateComponent";
import { Sprite } from "../entities/widgets/Sprite";

type GerminatingEntity = Sprite & {
	buildTime: number;
};

export class GerminateSystem extends System<GerminatingEntity> {
	static components = [GerminateComponent];

	test(entity: Sprite & { buildTime?: number }): entity is GerminatingEntity {
		return (
			GerminateComponent.has(entity) &&
			typeof entity.buildTime === "number"
		);
	}

	update(entity: GerminatingEntity, delta: number): void {
		const germinateComponent = entity.get(GerminateComponent)[0];
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
		if (newProgress === 1) GerminateComponent.clear(entity);
	}
}
