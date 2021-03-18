import type { Entity } from "../../core/Entity";
import { System } from "../../core/System";
import { isObstruction } from "../../engine/typeguards";
import type { Obstruction } from "../entities/Obstruction";
import { isPathable } from "../helpers";
import { currentMazingContest } from "../mazingContestContext";
import { isThunder } from "../typeguards";

export class BuildWatcher extends System<Obstruction> {
	readonly pure = true;
	static readonly components = [];

	test(entity: Entity): entity is Obstruction {
		return isObstruction(entity);
	}

	onAddEntity(obstruction: Obstruction): void {
		currentMazingContest().setTimeout(() => {
			if (isPathable() || !obstruction.isAlive) return;

			obstruction.kill();

			// All obstructions cost 1 lumber
			obstruction.owner.resources.lumber =
				(obstruction.owner.resources.lumber ?? 0) + 1;

			// Thunders cost 1 gold as well
			if (isThunder(obstruction))
				obstruction.owner.resources.gold =
					(obstruction.owner.resources.gold ?? 0) + 1;
		});
	}
}
