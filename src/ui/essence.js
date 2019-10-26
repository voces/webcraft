
import game from "../index.js";
import { document } from "../util/globals.js";

const element = document.getElementById( "essence" );

setTimeout( () => {

	game.addEventListener( "update", () => {

		if ( ! game.round ) return;
		element.textContent = Math.floor( game.localPlayer.resources.essence );

	} );

} );

