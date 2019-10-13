
import { document, localStorage, window } from "../util/globals.js";

const hotkeys = document.getElementById( "hotkeys" );

window.addEventListener( "keydown", e => {

	if ( e.key === "h" && e.ctrlKey ) {

		e.preventDefault();

		const showHotkeysUI = hotkeys.style.visibility === "hidden";

		hotkeys.style.visibility = showHotkeysUI ? "visible" : "hidden";
		localStorage.setItem( "showHotkeysUI", showHotkeysUI );

	}

} );

const showHotkeysUI = localStorage.getItem( "showHotkeysUI" ) === "true";
if ( ! showHotkeysUI ) hotkeys.style.visibility = "hidden";
