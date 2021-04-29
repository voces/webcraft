import { colors } from "../../engine/players/colors";
import { currentKatma } from "../katmaContext";
import { Player } from "./Player";

export const getPlaceholderPlayer = (): Player => {
	const katma = currentKatma();

	return (
		katma.players.find((p) => p.id === -1) ??
		new Player({
			color: colors.white,
			id: -1,
			score: { bulldog: 800 },
			game: katma,
		})
	);
};
