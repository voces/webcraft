
import Doodad from "../../entities/Doodad.js";

import Random from "../../../lib/seedrandom-alea.js";

function stateHandler( app, e ) {

	if ( e.local ) app.localPlayer = e.local;
	if ( e.seed ) app.random = new Random( e.seed );

	for ( const prop in e.state )
		if ( typeof e.state[ prop ] !== "object" || e.state[ prop ] === null || ! ( e.state[ prop ] instanceof Doodad ) )
			app.state[ prop ] = e.state[ prop ];

}

export default stateHandler;
