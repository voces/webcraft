import { document } from "../util/globals";
import { Game } from "../Game";

const element = document.getElementById("essence")!;

export const initEssenceListeners = (game: Game): void => {
	game.addEventListener("update", () => {
		if (!game.round || !game.localPlayer) return;
		element.textContent = Math.floor(
			game.localPlayer.resources.essence,
		).toString();
	});
};
