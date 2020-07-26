import { System } from "../core/System.js";
import { Sprite } from "../sprites/Sprite.js";
import {
	Animation,
	AnimationManager,
} from "../components/graphics/Animation.js";
import { GraphicComponentManager } from "../components/graphics/GraphicComponent.js";

export class AnimationSystem extends System<Sprite> {
	static components = [Animation];
	private entityData = new Map<Sprite, { animation: Animation }>();

	test(entity: Sprite): entity is Sprite {
		return (
			AnimationManager.has(entity) && GraphicComponentManager.has(entity)
		);
	}

	onAddEntity(entity: Sprite): void {
		const div = GraphicComponentManager.get(entity)?.entityElement;
		if (!div) return this.remove(entity);

		const animation = AnimationManager.get(entity);
		if (!animation) return this.remove(entity);

		div.classList.add(animation.animation);

		this.entityData.set(entity, { animation });
	}

	onRemoveEntity(entity: Sprite): void {
		const data = this.entityData.get(entity);
		if (!data) return;

		const div = GraphicComponentManager.get(entity)?.entityElement;
		if (!div) return this.remove(entity);

		div.classList.remove(data.animation.animation);
	}
}
