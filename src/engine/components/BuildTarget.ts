import { Sprite } from "../../entities/sprites/Sprite";
import { Obstruction } from "../../entities/sprites/obstructions/index";
import { Blueprint } from "../../entities/sprites/obstructions/Blueprint";
import { Point } from "../pathing/PathingMap";
import { Component } from "../../core/Component";
import { currentGame } from "../gameContext";

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
