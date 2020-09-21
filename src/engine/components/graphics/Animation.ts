import { Component } from "../../../core/Component";
import { Sprite } from "../../entities/widgets/Sprite";
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
		const mutable: Mutable<Animation> = this;
		mutable.animation = animation;

		setTimeout(
			wrapGame(currentGame(), () => this.entity.clear(this)),
			duration * 1000,
		);
	}
}
