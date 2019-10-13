
import theFarm from "./theFarm.js";
import theGap from "./theGap.js";
import theRock from "./theRock.js";
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
	theFarm,
	theGap,
	theRock,
].map( addPathing );
