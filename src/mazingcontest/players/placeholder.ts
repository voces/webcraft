import { colors } from "../../engine/players/colors";
import { currentMazingContest } from "../mazingContestContext";
import { Player } from "./Player";

export const getAlliedPlaceholderPlayer = (): Player => {
	const game = currentMazingContest();

	return (
		game.players.find((p) => p.id === -1) ??
		new Player({ color: colors.white, id: -1, game })
	);
};

export const getEnemyPlaceholderPlayer = (): Player => {
	const game = currentMazingContest();

	return (
		game.players.find((p) => p.id === -2) ??
		new Player({ color: colors.black, id: -2, game })
	);
};
