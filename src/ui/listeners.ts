import { document, localStorage } from "../util/globals.js";
import { registerCommand } from "./chat.js";
import { UI } from "./index.js";

const hotkeys = document.getElementById("hotkeys")!;

export const initListeners = (ui: UI): void => {
	ui.addEventListener("keyDown", ({ key, ctrlDown }) => {
		if (key !== "h" || !ctrlDown) return;

		const showHotkeysUI = hotkeys.style.visibility === "hidden";

		hotkeys.style.visibility = showHotkeysUI ? "visible" : "hidden";
		// todo: wrap localStorage with types!
		localStorage.setItem("showHotkeysUI", showHotkeysUI.toString());
	});
};

registerCommand({
	name: "hideHotkeys",
	comment:
		"Hides the hotkey icons at the bottom of the window\nToggle via Ctrl+H",
	handler: () => {
		hotkeys.style.visibility = "hidden";
		localStorage.setItem("showHotkeysUI", "false");
	},
});

registerCommand({
	name: "showHotkeys",
	comment:
		"Shows the hotkey icons at the bottom of the window\nToggle via Ctrl+H",
	handler: () => {
		hotkeys.style.visibility = "visible";
		localStorage.setItem("showHotkeysUI", "true");
	},
});

const showHotkeysUI = localStorage.getItem("showHotkeysUI") === "true";
if (!showHotkeysUI) hotkeys.style.visibility = "hidden";
