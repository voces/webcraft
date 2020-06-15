import { document } from "../util/globals.js";
import { context } from "../superContext.js";

const elem = document.getElementById("waiting-splash")!;

setTimeout(() => {
	context.network.addEventListener("init", ({ connections }) => {
		if (connections !== 0) elem.style.visibility = "visible";
	});

	context.network.addEventListener("state", () => {
		elem.style.visibility = "hidden";
	});
});
