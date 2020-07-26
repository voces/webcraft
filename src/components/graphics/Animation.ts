import { Component } from "../../core/Component.js";
import { Sprite } from "../../sprites/Sprite.js";
import { ComponentManager } from "../../core/ComponentManager.js";

export class Animation extends Component {
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

export const AnimationManager = new ComponentManager<Animation>(Animation);
