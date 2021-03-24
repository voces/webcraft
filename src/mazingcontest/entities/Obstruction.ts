import type { Action } from "../../engine/actions/types";
import type { ObstructionProps as EngineObstructionProps } from "../../engine/entities/widgets/sprites/units/Obstruction";
import { Obstruction as EngineObstruction } from "../../engine/entities/widgets/sprites/units/Obstruction";
import { selfDestructAction } from "../actions/selfDestruct";
import { currentMazingContest } from "../mazingContestContext";
import type { Resource } from "../types";

export type ObstructionProps = EngineObstructionProps<Resource>;

export class Obstruction extends EngineObstruction<Resource> {
	get actions(): Action[] {
		const mazingContest = currentMazingContest();
		if (mazingContest.mainLogic.round?.runnerStart) return [];
		const actions = super.actions;
		actions.push(
			this.owner === mazingContest.localPlayer
				? selfDestructAction
				: { ...selfDestructAction, cost: { tnt: 1 } },
		);
		return actions;
	}
}
