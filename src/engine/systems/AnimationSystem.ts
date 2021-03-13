import { AnimationClip } from "three";

import { System } from "../../core/System";
import { Animation } from "../components/graphics/Animation";
import { ThreeObjectComponent } from "../components/graphics/ThreeObjectComponent";
import type { Sprite } from "../entities/widgets/Sprite";

export class AnimationSystem extends System<Sprite> {
	static components = [Animation, ThreeObjectComponent];
	readonly pure = true;

	test(entity: Sprite): entity is Sprite {
		return Animation.has(entity) && ThreeObjectComponent.has(entity);
	}

	render(entity: Sprite, delta: number): void {
		const objectComponent = entity.get(ThreeObjectComponent)[0];
		if (!objectComponent) return this.remove(entity);

		objectComponent.mixer.update(delta);
	}

	onAddEntity(entity: Sprite): void {
		const animation = entity.get(Animation)[0];
		if (!animation) return this.remove(entity);

		const objectComponent = entity.get(ThreeObjectComponent)[0];
		if (!objectComponent) return this.remove(entity);
		const clip = AnimationClip.findByName(
			objectComponent.object.animations,
			animation.animation,
		);

		if (!clip)
			return console.warn(
				`Attempted to play aniamtion '${animation.animation}' on ${objectComponent.object.name}, but it wasn't found`,
			);

		const action = objectComponent.mixer.clipAction(clip);
		action.clampWhenFinished = true;
		action.reset().play();
	}
}
