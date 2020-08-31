import { Sprite } from "../entities/sprites/Sprite";
import { DeprecatedComponent } from "../core/Component";
import { DeprecatedComponentManager } from "../core/DeprecatedComponentManager";
import { Obstruction } from "../entities/sprites/obstructions/index";
import { Blueprint } from "../entities/sprites/obstructions/Blueprint";
import { Point } from "../pathing/PathingMap";

export class BuildTarget extends DeprecatedComponent {
	obstructionClass: typeof Obstruction;
	target: Point;
	blueprint?: Blueprint;

	constructor(
		entity: Sprite,
		obstructionClass: typeof Obstruction,
		target: Point,
	) {
		super(entity);
		this.obstructionClass = obstructionClass;

		this.target = target;

		this.blueprint =
			entity.owner === entity.game.localPlayer
				? new Blueprint({
						...target,
						game: entity.game,
						obstruction: obstructionClass,
				  })
				: undefined;
	}

	dispose(): void {
		this.blueprint?.kill({ removeImmediately: true });
	}
}

export const BuildTargetManager = new DeprecatedComponentManager<BuildTarget>(
	BuildTarget,
);
