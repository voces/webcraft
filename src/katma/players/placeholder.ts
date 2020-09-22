import { colors } from "../../engine/players/colors";
import { currentKatma } from "../katmaContext";
import { Player } from "./Player";

let placeholderPlayer: Player;

export const getPlaceholderPlayer = (): Player => {
	if (placeholderPlayer) return placeholderPlayer;

	const katma = currentKatma();

	placeholderPlayer = new Player({
		color: colors.white,
		id: -1,
		score: { bulldog: 800 },
		game: katma,
	});

	return placeholderPlayer;
};
