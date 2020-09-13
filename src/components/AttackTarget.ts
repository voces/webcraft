import { Sprite } from "../entities/sprites/Sprite";
import { Component } from "../core/Component";
import { Mutable } from "../types";

export class AttackTarget extends Component<[Sprite]> {
	readonly target!: Sprite;

	initialize(target: Sprite): void {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const that: Mutable<AttackTarget> = this;
		that.target = target;
	}
}
