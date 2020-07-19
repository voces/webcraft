import { Sprite } from "../sprites/Sprite.js";
import { Component } from "../core/Component.js";
import { ComponentManager } from "../core/ComponentManager.js";
import { INITIAL_OBSTRUCTION_PROGRESS } from "../constants.js";

export class GerminateComponent extends Component {
	progress = INITIAL_OBSTRUCTION_PROGRESS;

	constructor(entity: Sprite) {
		super(entity);
	}
}

export const GerminateComponentManager = new ComponentManager<
	GerminateComponent
>(GerminateComponent);
