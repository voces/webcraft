import { Component } from "../../core/Component";
import { Sprite } from "../entities/widgets/Sprite";
import { Blueprint } from "../entities/widgets/sprites/Blueprint";
import { Obstruction } from "../entities/widgets/sprites/units/Obstruction";
import { currentGame } from "../gameContext";
import { Point } from "../pathing/PathingMap";

export class BuildTarget extends Component {
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
			entity.owner === currentGame().localPlayer
				? new Blueprint({
						...target,
						obstruction: obstructionClass,
				  })
				: undefined;
	}

	dispose(): void {
		this.blueprint?.kill({ removeImmediately: true });
	}
}
