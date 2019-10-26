
import game from "../index.js";
import { WORLD_TO_GRAPHICS_RATIO } from "../constants.js";
import { document, window } from "../util/globals.js";
import { clientToWorld } from "../players/camera.js";
import { appendErrorMessage } from "../ui/chat.js";

let plannedObstruction;
let pathable;
const mouse = { x: 0, y: 0 };
const arena = document.getElementById( "arena" );
const container = document.createElement( "div" );
container.style.position = "absolute";
container.style.display = "flex";
container.style.flexWrap = "wrap";
const pathableCells = [];
const unpathableCells = [];
let requestedAnimationFrame;

const updateSize = () => {

	container.style.width = `${plannedObstruction.radius * WORLD_TO_GRAPHICS_RATIO * 2}px`;
	container.style.height = `${plannedObstruction.radius * WORLD_TO_GRAPHICS_RATIO * 2}px`;
	updatePosition();

};

const createCell = pathable => {

	const cell = document.createElement( "div" );
	cell.style.width = WORLD_TO_GRAPHICS_RATIO + "px";
	cell.style.height = WORLD_TO_GRAPHICS_RATIO + "px";
	cell.style.display = "inline-block";
	cell.style.backgroundColor = pathable ?
		"rgba( 63, 255, 127, 0.5 )" :
		"rgba( 255, 63, 63, 0.5 )";

	return cell;

};

// We shouldn't just nuke the cells
const updateCells = () => {

	if ( ! game.round ) return;

	const pathing = plannedObstruction.requiresPathing;
	const radius = plannedObstruction.radius;
	const xStart = snap( mouse.x ) - radius;
	const yStart = snap( mouse.y ) - radius;

	// We should link cells to grid tiles and update them in this case
	// if ( radius === updateCells.radiusLast &&
	//     xStart === updateCells.xStartLast &&
	//     yStart === updateCells.yStartLast
	// ) return;
	updateCells.radiusLast = radius;
	updateCells.xStartLast = xStart;
	updateCells.yStartLast = yStart;

	game.round.pathingMap.withoutEntity( game.localPlayer.unit, () => {

		const xFinal = xStart + radius * 2;
		const yFinal = yStart + radius * 2;

		container.innerHTML = "";

		let overallPathable = true;
		const grid = game.round.pathingMap.grid;
		let pathableIndex = 0;
		let unpathableIndex = 0;
		for ( let y = yStart; y < yFinal; y += 1 )
			for ( let x = xStart; x < xFinal; x += 1 ) {

				const pathable = grid[ y * 2 ] && grid[ y * 2 ][ x * 2 ] && grid[ y * 2 ][ x * 2 ].pathable( pathing ) &&
					grid[ y * 2 ] && grid[ y * 2 ][ x * 2 + 1 ] && grid[ y * 2 ][ x * 2 + 1 ].pathable( pathing ) &&
					grid[ y * 2 + 1 ] && grid[ y * 2 + 1 ][ x * 2 ] && grid[ y * 2 + 1 ][ x * 2 ].pathable( pathing ) &&
					grid[ y * 2 + 1 ] && grid[ y * 2 + 1 ][ x * 2 + 1 ] && grid[ y * 2 + 1 ][ x * 2 + 1 ].pathable( pathing );

				if ( pathable ) {

					if ( ! pathableCells[ pathableIndex ] )
						pathableCells[ pathableIndex ] = createCell( true );

					container.appendChild( pathableCells[ pathableIndex ] );
					pathableIndex ++;

				} else {

					if ( ! unpathableCells[ unpathableIndex ] )
						unpathableCells[ unpathableIndex ] = createCell( false );

					container.appendChild( unpathableCells[ unpathableIndex ] );
					unpathableIndex ++;

					overallPathable = false;

				}

			}

		pathable = overallPathable;

	} );

};

const onFrame = () => {

	requestedAnimationFrame = requestAnimationFrame( onFrame );
	updateCells();

};

const edgeSnap = v => Math.round( v );
const midSnap = v => Math.floor( v ) + 0.5;
export const snap = v => {

	const snapFunc = ! plannedObstruction || plannedObstruction.radius % 1 === 0 ?
		edgeSnap :
		midSnap;

	return snapFunc( v );

};

const updatePosition = () => {

	container.style.left = `${( snap( mouse.x ) - plannedObstruction.radius ) * WORLD_TO_GRAPHICS_RATIO}px`;
	container.style.top = `${( snap( mouse.y ) - plannedObstruction.radius ) * WORLD_TO_GRAPHICS_RATIO}px`;
	updateCells();

};

window.addEventListener( "mousemove", e => {

	Object.assign( mouse, clientToWorld( { x: e.clientX, y: e.clientY } ) );

	if ( plannedObstruction ) updatePosition();

} );

export const start = obstruction => {

	if ( obstruction.cost ) {

		const check = game.localPlayer.checkResources( obstruction.cost );
		if ( check.length ) {

			appendErrorMessage( `Not enough ${check.join( " " )}` );
			return;

		}

	}

	plannedObstruction = obstruction;
	updateSize();
	arena.appendChild( container );
	if ( requestedAnimationFrame ) cancelAnimationFrame( requestedAnimationFrame );
	requestedAnimationFrame = requestAnimationFrame( onFrame );

};

export const stop = () => {

	if ( ! plannedObstruction ) return;
	plannedObstruction = undefined;
	arena.removeChild( container );
	if ( requestedAnimationFrame ) cancelAnimationFrame( requestedAnimationFrame );
	requestedAnimationFrame = undefined;

};

export const active = () => plannedObstruction;

export const valid = () => !! plannedObstruction && pathable;
