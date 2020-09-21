import { colors } from "../../engine/players/colors";
import { Player } from "../../engine/players/Player";
import { currentKatma } from "../katmaContext";

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
