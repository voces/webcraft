import { Sprite } from "../entities/sprites/Sprite";
import { DeprecatedComponent } from "../core/Component";
import { DeprecatedComponentManager } from "../core/DeprecatedComponentManager";

export class AttackTarget extends DeprecatedComponent {
	target: Sprite;

	constructor(entity: Sprite, target: Sprite) {
		super(entity);
		this.target = target;
	}
}

export const AttackTargetManager = new DeprecatedComponentManager<AttackTarget>(
	AttackTarget,
);
