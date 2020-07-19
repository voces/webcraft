import { Sprite } from "../sprites/Sprite.js";
import { Component } from "../core/Component.js";
import { ComponentManager } from "../core/ComponentManager.js";

export class AttackTarget extends Component {
	target: Sprite;

	constructor(entity: Sprite, target: Sprite) {
		super(entity);
		this.target = target;
	}
}

export const AttackTargetManager = new ComponentManager<AttackTarget>(
	AttackTarget,
);
