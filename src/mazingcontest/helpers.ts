import { PATHING_TYPES } from "../engine/constants";
import { currentMazingContest } from "./mazingContestContext";
import { terrain } from "./terrain";

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
	const path = game.pathingMap.path(spawn, target);
	const last = path[path.length - 1];
	return (
		Math.abs(last.x - target.x) < 0.1 && Math.abs(last.y - target.y) < 0.1
	);
};
