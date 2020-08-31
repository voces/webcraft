import { Sprite } from "../entities/sprites/Sprite";
import { DeprecatedComponent } from "../core/Component";
import { DeprecatedComponentManager } from "../core/DeprecatedComponentManager";
import { INITIAL_OBSTRUCTION_PROGRESS } from "../constants";

export class GerminateComponent extends DeprecatedComponent {
	progress = INITIAL_OBSTRUCTION_PROGRESS;

	constructor(entity: Sprite) {
		super(entity);
	}
}

export const GerminateComponentManager = new DeprecatedComponentManager<
	GerminateComponent
>(GerminateComponent);
