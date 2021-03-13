import { Component } from "../../core/Component";
import type { Sprite } from "../entities/widgets/Sprite";
import type { Mutable } from "../types";

export class AttackTarget extends Component<[Sprite]> {
	readonly target!: Sprite;

	initialize(target: Sprite): void {
		const mutable: Mutable<AttackTarget> = this;
		mutable.target = target;
	}
}
