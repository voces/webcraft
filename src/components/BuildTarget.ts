import { Sprite } from "../sprites/Sprite.js";
import { Component } from "../core/Component.js";
import { ComponentManager } from "../core/ComponentManager.js";
import { ObstructionSubclass } from "../sprites/obstructions/index.js";
import { Blueprint } from "../sprites/obstructions/Blueprint.js";
import { Point } from "../pathing/PathingMap.js";

export class BuildTarget extends Component {
	obstructionClass: ObstructionSubclass;
	target: Point;
	blueprint?: Blueprint;

	constructor(
		entity: Sprite,
		obstructionClass: ObstructionSubclass,
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
						radius: obstructionClass.defaults.radius,
				  })
				: undefined;
	}

	dispose(): void {
		this.blueprint?.kill({ removeImmediately: true });
	}
}

export const BuildTargetManager = new ComponentManager<BuildTarget>(
	BuildTarget,
);
