import { window } from "../core/util/globals";
import { Katma } from "./Katma";
import { activeHost, KatmaNetwork } from "./KatmaNetwork";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const network = ((globalThis as any).network = new KatmaNetwork());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).game = new Katma(network);

window.addEventListener("contextmenu", (e: Event) => {
	e.preventDefault();
});

let remainingErrors = 3;
window.addEventListener("error", (event: { error: Error }) => {
	if (remainingErrors === 0) return;
	remainingErrors--;

	fetch(`http://${activeHost}/error`, {
		method: "POST",
		body: JSON.stringify({ stack: event.error.stack }),
		headers: { "Content-Type": "application/json" },
	});

	console.error(event.error);
});
setInterval(() => (remainingErrors = Math.min(3, remainingErrors + 1)), 5000);
