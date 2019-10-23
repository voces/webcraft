
import { document, localStorage, window } from "../util/globals.js";
import { registerCommand } from "./chat.js";

const hotkeys = document.getElementById( "hotkeys" );

window.addEventListener( "keydown", e => {

	if ( e.key === "h" && e.ctrlKey ) {

		e.preventDefault();

		const showHotkeysUI = hotkeys.style.visibility === "hidden";

		hotkeys.style.visibility = showHotkeysUI ? "visible" : "hidden";
		localStorage.setItem( "showHotkeysUI", showHotkeysUI );

	}

} );

registerCommand( {
	name: "hideHotkeys",
	comment: "Hides the hotkey icons at the bottom of the window\nToggle via Ctrl+H",
	handler: () => {

		hotkeys.style.visibility = "hidden";
		localStorage.setItem( "showHotkeysUI", false );

	},
} );

registerCommand( {
	name: "showHotkeys",
	comment: "Shows the hotkey icons at the bottom of the window\nToggle via Ctrl+H",
	handler: () => {

		hotkeys.style.visibility = "visible";
		localStorage.setItem( "showHotkeysUI", true );

	},
} );

const showHotkeysUI = localStorage.getItem( "showHotkeysUI" ) === "true";
if ( ! showHotkeysUI ) hotkeys.style.visibility = "hidden";
