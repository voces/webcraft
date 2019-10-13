
import theDump from "./theDump.js";
import theFarm from "./theFarm.js";
import theGap from "./theGap.js";
import theRock from "./theRock.js";
import theTamedWoods from "./theTamedWoods.js";
import theTarget from "./theTarget.js";
import theTinyRectangle from "./theTinyRectangle.js";
import theWoods from "./theWoods.js";

import { PATHING_TYPES } from "../pathing/constants.js";

const getHeight = arena => arena.layers.length;
const getWidth = arena => Math.max(
	...arena.layers.map( l => l.length ),
	...arena.tiles.map( t => t.length )
);

const addPathing = arena =>
	Object.assign( arena, {
		pathing: Array( getHeight( arena ) ).fill().map( ( _, y ) =>
			Array( getWidth( arena ) ).fill().map( ( _, x ) =>
				arena.layers[ y ][ x ] > 0 ?
					PATHING_TYPES.WALKABLE | PATHING_TYPES.BUILDABLE :
					arena.tiles[ y ][ x ] === 1 || arena.tiles[ y ][ x ] === 2 ?
						PATHING_TYPES.BUILDABLE :
						0
			) ),
	} );

export default [
	theDump,
	theFarm,
	theGap,
	theRock,
	theTamedWoods,
	theTarget,
	theTinyRectangle,
	theWoods,
].map( addPathing );
