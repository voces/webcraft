import { Component } from "../../../core/Component";
import { Sprite } from "../../../entities/sprites/Sprite";
import { currentGame, wrapGame } from "../../gameContext";
import { Mutable } from "../../types";

export class Animation extends Component<[string, number]> {
	readonly animation!: string;

	/**
	 * @param duration Time in seconds for how long the animation plays.
	 */
	constructor(entity: Sprite, animation: string, duration: number) {
		super(entity, animation, duration);
	}

	initialize(animation: string, duration: number): void {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const that: Mutable<Animation> = this;
		that.animation = animation;

		setTimeout(
			wrapGame(currentGame(), () => this.entity.clear(this)),
			duration * 1000,
		);
	}
}
