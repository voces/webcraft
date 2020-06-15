import { document } from "../util/globals.js";
import { context } from "../superContext.js";

const element = document.getElementById("clock")!;

const formatSeconds = (time: number) => {
	// Don't render millieconds
	time = Math.floor(time);

	const seconds = Math.max(time % 60, 0).toString();
	time = Math.floor(time / 60);

	const minutes = Math.max(time % 60, 0).toString();

	return minutes.padStart(2, "0") + ":" + seconds.padStart(2, "0");
};

setTimeout(() => {
	context.game.addEventListener("update", (time) => {
		if (!context.game.round) return;
		element.textContent = formatSeconds(context.game.round.expireAt - time);
	});
});
