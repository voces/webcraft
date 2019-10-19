
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
const getPathableLayers = arena =>
	Array.from( new Set( arena.layers.flat() ) )
		.filter( ( layer, _, arr ) => ! isNaN( layer ) && ( layer <= 1 || arr.includes( layer - 1 ) ) );

const processArena = arena => {

	const height = getHeight( arena );
	const width = getWidth( arena );
	const pathableLayers = getPathableLayers( arena );

	const pathing = Array( height ).fill().map( ( _, y ) =>
		Array( width ).fill().map( ( _, x ) =>
			! ( arena.layers[ y ][ x ] === 0 || isNaN( arena.layers[ y ][ x ] ) || pathableLayers.includes( arena.layers[ y ][ x ] ) ) ?
				PATHING_TYPES.WALKABLE | PATHING_TYPES.BUILDABLE :
				isNaN( arena.tiles[ y ][ x ] ) ?
					PATHING_TYPES.WALKABLE | PATHING_TYPES.BUILDABLE :
					arena.tiles[ y ][ x ] === 1 || arena.tiles[ y ][ x ] === 2 ?
						PATHING_TYPES.BUILDABLE :
						0
		) );

	return Object.assign( arena, {
		layers: arena.layers.map( row => row.map( v => v || 0 ) ),
		pathing,
	} );

};

export default [
	theDump,
	theFarm,
	theGap,
	theRock,
	theTamedWoods,
	theTarget,
	theTinyRectangle,
	theWoods,
].map( processArena );
