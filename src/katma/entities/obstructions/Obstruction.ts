import type { Action } from "../../../engine/actions/types";
import type { ObstructionProps as EngineObstructionProps } from "../../../engine/entities/widgets/sprites/units/Obstruction";
import { Obstruction as EngineObstruction } from "../../../engine/entities/widgets/sprites/units/Obstruction";
import { selfDestructAction } from "../../actions/selfDestruct";
import type { Resource } from "../../types";

export type ObstructionProps = EngineObstructionProps<Resource>;

export class Obstruction extends EngineObstruction<Resource> {
	get actions(): Action[] {
		const actions = super.actions;
		actions.push(selfDestructAction);
		return actions;
	}
}
