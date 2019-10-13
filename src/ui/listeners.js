
import { document, window } from "../util/globals.js";

const hotkeys = document.getElementById( "hotkeys" );

window.addEventListener( "keydown", e => {

	if ( e.key === "h" && e.ctrlKey ) {

		e.preventDefault();

		hotkeys.style.visibility = hotkeys.style.visibility === "hidden" ?
			"visible" :
			"hidden";

	}

} );
