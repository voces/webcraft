import { colors } from "../../engine/players/colors";
import { currentMazingContest } from "../mazingContestContext";
import { Player } from "./Player";

let placeholderPlayer: Player;

export const getPlaceholderPlayer = (): Player => {
	if (placeholderPlayer) return placeholderPlayer;

	const game = currentMazingContest();

	placeholderPlayer = new Player({ color: colors.white, id: -1, game });

	return placeholderPlayer;
};
