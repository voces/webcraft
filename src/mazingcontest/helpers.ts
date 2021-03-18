import { PATHING_TYPES } from "../engine/constants";
import { currentMazingContest } from "./mazingContestContext";
import { terrain } from "./terrain";
import { isCheckpoint } from "./typeguards";

const spawn = {
	collisionRadius: 0.5,
	pathing: PATHING_TYPES.WALKABLE,
	x: terrain.width / 2,
	y: terrain.height / 2 - 10.5,
};
const target = {
	x: terrain.width / 2,
	y: terrain.height / 2 + 10.5,
};
export const isPathable = (): boolean => {
	const game = currentMazingContest();

	if (game.settings.checkpoints) {
		const checkpoint = game.entities.find(isCheckpoint)!;
		const path = game.pathingMap.path(spawn, checkpoint.position);
		const last = path[path.length - 1];
		if (
			Math.abs(last.x - checkpoint.position.x) > 0.1 ||
			Math.abs(last.y - checkpoint.position.y) > 0.1
		)
			return false;

		const path2 = game.pathingMap.path(spawn, target, checkpoint.position);
		const last2 = path2[path2.length - 1];
		return (
			Math.abs(last2.x - target.x) < 0.1 &&
			Math.abs(last2.y - target.y) < 0.1
		);
	}

	const path = game.pathingMap.path(spawn, target);
	const last = path[path.length - 1];
	return (
		Math.abs(last.x - target.x) < 0.1 && Math.abs(last.y - target.y) < 0.1
	);
};
