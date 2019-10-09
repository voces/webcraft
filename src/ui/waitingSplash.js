
import network from "../network.js";
import { document } from "../util/globals.js";

const elem = document.getElementById( "waiting-splash" );

network.addEventListener( "init", ( { connections } ) => {

	if ( connections !== 0 )
		elem.style.visibility = "visible";

} );

network.addEventListener( "state", () => {

	elem.style.visibility = "hidden";

} );
