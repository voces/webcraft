import { colors } from "../../engine/players/colors";
import { currentMazingContest } from "../mazingContestContext";
import { Player } from "./Player";

let alliedPlaceholderPlayer: Player;
export const getAlliedPlaceholderPlayer = (): Player => {
	if (alliedPlaceholderPlayer) return alliedPlaceholderPlayer;

	const game = currentMazingContest();

	alliedPlaceholderPlayer = new Player({ color: colors.white, id: -1, game });

	return alliedPlaceholderPlayer;
};

let enemyPlaceholderPlayer: Player;
export const getEnemyPlaceholderPlayer = (): Player => {
	if (enemyPlaceholderPlayer) return enemyPlaceholderPlayer;

	const game = currentMazingContest();

	enemyPlaceholderPlayer = new Player({ color: colors.black, id: -2, game });

	return enemyPlaceholderPlayer;
};
