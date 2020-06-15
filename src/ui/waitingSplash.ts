import { document } from "../util/globals.js";
import { context } from "../superContext.js";

const elem = document.getElementById("waiting-splash")!;

setTimeout(() => {
	context.game.addNetworkListener("init", ({ connections }) => {
		if (connections !== 0) elem.style.visibility = "visible";
	});

	context.game.addNetworkListener("state", () => {
		elem.style.visibility = "hidden";
	});
});
