import { document } from "../util/globals.js";
import { Game } from "../Game.js";

const element = document.getElementById("clock")!;

const formatSeconds = (time: number) => {
	// Don't render millieconds
	time = Math.floor(time);

	const seconds = Math.max(time % 60, 0).toString();
	time = Math.floor(time / 60);

	const minutes = Math.max(time % 60, 0).toString();

	return minutes.padStart(2, "0") + ":" + seconds.padStart(2, "0");
};

export const initClockListeners = (game: Game): void => {
	game.addEventListener("update", (time) => {
		if (!game.round) return;
		element.textContent = formatSeconds(game.round.expireAt - time);
	});
};
