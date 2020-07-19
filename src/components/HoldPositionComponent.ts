import { Sprite } from "../sprites/Sprite.js";
import { Component } from "../core/Component.js";
import { ComponentManager } from "../core/ComponentManager.js";

export class HoldPositionComponent extends Component {
	constructor(entity: Sprite) {
		super(entity);
	}
}

export const HoldPositionManager = new ComponentManager<HoldPositionComponent>(
	HoldPositionComponent,
);
