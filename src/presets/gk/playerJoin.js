
import * as env from "../../env.js";

import Random from "../../../lib/seedrandom-alea.js";

// Server + Local
function playerJoinHandler( app, e ) {

	// Don't do anything on the server
	if ( env.isServer ) return;

	if ( e.seed ) app.random = new Random( e.seed );

	if ( app.players.dict[ "p" + e.player.id ] ) return;

	new app.Player( Object.assign( { key: "p" + e.player.id }, e.player ) );

}

export default playerJoinHandler;
