import { Sprite } from "../entities/sprites/Sprite";
import { DeprecatedComponent } from "../core/Component";
import { DeprecatedComponentManager } from "../core/DeprecatedComponentManager";

export class HoldPositionComponent extends DeprecatedComponent {
	constructor(entity: Sprite) {
		super(entity);
	}
}

export const HoldPositionManager = new DeprecatedComponentManager<
	HoldPositionComponent
>(HoldPositionComponent);
