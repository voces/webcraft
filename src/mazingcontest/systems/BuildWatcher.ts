import type { Entity } from "../../core/Entity";
import { System } from "../../core/System";
import { isObstruction } from "../../engine/typeguards";
import { ForPlayer } from "../components/ForPlayer";
import type { Obstruction } from "../entities/Obstruction";
import { isPathable } from "../helpers";
import { currentMazingContest } from "../mazingContestContext";
import { isCheckpoint, isThunder } from "../typeguards";

export class BuildWatcher extends System<Obstruction> {
	readonly pure = true;
	static readonly components = [];

	test(entity: Entity): entity is Obstruction {
		return isObstruction(entity) && !isCheckpoint(entity);
	}

	onAddEntity(obstruction: Obstruction): void {
		currentMazingContest().setTimeout(() => {
			if (isCheckpoint(obstruction) || !obstruction.isAlive) return;

			const pId =
				obstruction.owner.id >= 0
					? obstruction.owner.color!.index
					: obstruction.get(ForPlayer)[0]?.player.color!.index;

			if (pId === undefined)
				throw new Error(
					"Expected obstruction to be a real player or have a ForPlayer",
				);

			if (isPathable(pId)) return;

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
