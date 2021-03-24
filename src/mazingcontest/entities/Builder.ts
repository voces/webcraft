import type { Action } from "../../engine/actions/types";
import type { UnitProps } from "../../engine/entities/widgets/sprites/Unit";
import { Unit } from "../../engine/entities/widgets/sprites/Unit";
import { destroyLast } from "../actions/destroyLast";
import { readyAction } from "../actions/ready";
import { Block } from "./Block";
import { Thunder } from "./Thunder";

export class Builder extends Unit {
	static defaults = {
		...Unit.defaults,
		builds: [Block, Thunder],
		collisionRadius: 0.5,
		requiresPathing: 0,
		speed: 25,
		zOffset: 2,
	};

	isBuilder = true;

	constructor(props: UnitProps) {
		super({ ...Builder.clonedDefaults, ...props });
	}

	get actions(): Action[] {
		const actions = super.actions.filter(
			// Not interesting in MC
			(a) => a.name !== "Hold Position" && a.name !== "Stop",
		);
		actions.push(destroyLast);
		actions.push(readyAction);
		return actions;
	}
}
