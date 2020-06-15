import { document } from "../util/globals.js";
import { context } from "../superContext.js";

const element = document.getElementById("essence")!;

setTimeout(() => {
	context.game.addEventListener("update", () => {
		if (!context.game.round || !context.game.localPlayer) return;
		element.textContent = Math.floor(
			context.game.localPlayer.resources.essence,
		).toString();
	});
});
