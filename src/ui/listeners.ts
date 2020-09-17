import { document, localStorage } from "../core/util/globals";
import { registerCommand } from "./chat";
import { UI } from "./index";

export const initListeners = (ui: UI): void => {
	ui.addEventListener("keyDown", ({ key, ctrlDown }) => {
		if (key !== "h" || !ctrlDown) return;

		const hotkeys = document.getElementById("hotkeys")!;
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
		const hotkeys = document.getElementById("hotkeys")!;
		hotkeys.style.visibility = "hidden";
		localStorage.setItem("showHotkeysUI", "false");
	},
});

registerCommand({
	name: "showHotkeys",
	comment:
		"Shows the hotkey icons at the bottom of the window\nToggle via Ctrl+H",
	handler: () => {
		const hotkeys = document.getElementById("hotkeys")!;
		hotkeys.style.visibility = "visible";
		localStorage.setItem("showHotkeysUI", "true");
	},
});

{
	const showHotkeysUI = localStorage.getItem("showHotkeysUI") === "true";
	const hotkeys = document.getElementById("hotkeys");
	if (hotkeys && !showHotkeysUI) hotkeys.style.visibility = "hidden";
}
