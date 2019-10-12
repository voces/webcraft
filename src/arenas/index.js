
import a from "./a.js";
import b from "./b.js";
import c from "./c.js";
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
	a,
	b,
	c,
].map( addPathing );
