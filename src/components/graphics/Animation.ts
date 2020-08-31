import { DeprecatedComponent } from "../../core/Component";
import { Sprite } from "../../entities/sprites/Sprite";
import { DeprecatedComponentManager } from "../../core/DeprecatedComponentManager";

export class Animation extends DeprecatedComponent {
	readonly animation: string;

	/**
	 * @param duration Time in seconds for how long the animation plays.
	 */
	constructor(entity: Sprite, animation: string, duration: number) {
		super(entity);
		this.animation = animation;

		setTimeout(() => {
			const animation = AnimationManager.get(entity);
			if (animation === this) AnimationManager.delete(entity);
		}, duration * 1000);
	}
}

export const AnimationManager = new DeprecatedComponentManager<Animation>(
	Animation,
);
