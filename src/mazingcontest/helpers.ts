import { PATHING_TYPES } from "../engine/constants";
import { ForPlayer } from "./components/ForPlayer";
import type { Checkpoint } from "./entities/Checkpoint";
import { currentMazingContest } from "./mazingContestContext";
import { getAlliedPlaceholderPlayer } from "./players/placeholder";
import { spawn, target } from "./terrain";
import { isCheckpoint } from "./typeguards";

const spawnEntity = {
	collisionRadius: 0.5,
	pathing: PATHING_TYPES.WALKABLE,
};
export const isPathable = (i: number): boolean => {
	const game = currentMazingContest();

	const finalSpawnEntity = { ...spawnEntity, ...spawn(i) };
	const lTarget = target(i);

	const checkpoint = getCheckpoint(i);
	if (!checkpoint) return false;

	const checkpointPosition = {
		x: checkpoint.position.x,
		y: checkpoint.position.y,
	};
	const path = game.pathingSystem.path(finalSpawnEntity, checkpointPosition);
	const last = path[path.length - 1];
	if (
		Math.abs(last.x - checkpointPosition.x) > 0.1 ||
		Math.abs(last.y - checkpointPosition.y) > 0.1
	)
		return false;

	const path2 = game.pathingSystem.path(
		{ ...spawnEntity, ...spawn(i) },
		lTarget,
		checkpoint.position,
	);
	const last2 = path2[path2.length - 1];

	return (
		Math.abs(last2.x - lTarget.x) < 0.1 &&
		Math.abs(last2.y - lTarget.y) < 0.1
	);
};

export const getCheckpoint = (i: number): Checkpoint | undefined =>
	getAlliedPlaceholderPlayer().sprites.find(
		(s): s is Checkpoint =>
			isCheckpoint(s) && s.get(ForPlayer)[0]?.player?.color?.index === i,
	);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isConstructor = <C extends new (...args: any[]) => unknown>(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
	obj: any,
): obj is C => typeof obj === "function" && !!obj.prototype.constructor.name;
