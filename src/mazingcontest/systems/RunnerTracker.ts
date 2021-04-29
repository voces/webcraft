import type { Entity } from "../../core/Entity";
import { System } from "../../core/System";
import { MoveTarget } from "../../engine/components/MoveTarget";
import { ForPlayer } from "../components/ForPlayer";
import { HasHitCheckpoint } from "../components/HitCheckpoint";
import { IsDone } from "../components/IsDone";
import type { Runner } from "../entities/Runner";
import { currentMazingContest } from "../mazingContestContext";
import { target } from "../terrain";
import { isRunner } from "../typeguards";

export class RunnerTracker extends System<Runner> {
	readonly pure = true;
	static readonly components = [MoveTarget];

	test(entity: Entity): entity is Runner {
		return isRunner(entity);
	}

	modified(entity: Runner): void {
		if (!entity.idle || entity.has(HasHitCheckpoint)) return;

		new HasHitCheckpoint(entity);

		const pIdx = entity.get(ForPlayer)[0]?.player.color?.index;
		if (pIdx !== undefined) entity.walkTo(target(pIdx));
	}

	get done(): boolean {
		let done = true;
		for (const runner of this)
			if (runner.idle && runner.has(HasHitCheckpoint)) {
				if (!runner.has(IsDone))
					new IsDone(runner, currentMazingContest().time);
			} else done = false;

		return done;
	}
}
