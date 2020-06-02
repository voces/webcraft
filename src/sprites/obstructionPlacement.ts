
import game from "../index.js";
import { WORLD_TO_GRAPHICS_RATIO } from "../constants.js";
import { document, window } from "../util/globals.js";
import { clientToWorld } from "../players/camera.js";
import { appendErrorMessage } from "../ui/chat.js";
import { ObstructionSubclass } from "./obstructions/index.js";

let plannedObstruction: ObstructionSubclass | undefined;
let pathable: boolean;
const mouse = { x: 0, y: 0 };
const arena = document.getElementById( "arena" )!;
const container = document.createElement( "div" );
container.style.position = "absolute";
container.style.display = "flex";
container.style.flexWrap = "wrap";
const pathableCells: HTMLDivElement[] = [];
const unpathableCells: HTMLDivElement[] = [];
let requestedAnimationFrame: number | undefined;

// let radiusLast: number;
// let xStartLast: number;
// let yStartLast: number;

const updateSize = () => {

	if ( ! plannedObstruction ) return;

	container.style.width = `${plannedObstruction.defaults.radius * WORLD_TO_GRAPHICS_RATIO * 2}px`;
	container.style.height = `${plannedObstruction.defaults.radius * WORLD_TO_GRAPHICS_RATIO * 2}px`;
	updatePosition();

};

const createCell = ( pathable: boolean ) => {

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

	if ( ! game.round || ! plannedObstruction ) return;

	const pathing = plannedObstruction.defaults.requiresPathing;
	const radius = plannedObstruction.defaults.radius;
	const xStart = snap( mouse.x ) - radius;
	const yStart = snap( mouse.y ) - radius;

	// We should link cells to grid tiles and update them in this case
	// if ( radius === updateCells.radiusLast &&
	//     xStart === updateCells.xStartLast &&
	//     yStart === updateCells.yStartLast
	// ) return;
	// radiusLast = radius;
	// xStartLast = xStart;
	// yStartLast = yStart;

	const unit = game.localPlayer.unit;
	if ( ! unit ) return;

	game.round.pathingMap.withoutEntity( unit, () => {

		const xFinal = xStart + radius * 2;
		const yFinal = yStart + radius * 2;

		container.innerHTML = "";

		let overallPathable = true;
		const grid = unit.round.pathingMap.grid;
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

const edgeSnap = ( v: number ) => Math.round( v );
const midSnap = ( v: number ) => Math.floor( v ) + 0.5;
export const snap = ( v: number ): number => {

	const snapFunc = ! plannedObstruction || plannedObstruction.defaults.radius % 1 === 0 ?
		edgeSnap :
		midSnap;

	return snapFunc( v );

};

const updatePosition = () => {

	if ( ! plannedObstruction ) return;

	container.style.left = `${( snap( mouse.x ) - plannedObstruction.defaults.radius ) * WORLD_TO_GRAPHICS_RATIO}px`;
	container.style.top = `${( snap( mouse.y ) - plannedObstruction.defaults.radius ) * WORLD_TO_GRAPHICS_RATIO}px`;
	updateCells();

};

window.addEventListener( "mousemove", e => {

	Object.assign( mouse, clientToWorld( { x: e.clientX, y: e.clientY } ) );

	if ( plannedObstruction ) updatePosition();

} );

export const start = ( obstruction: ObstructionSubclass ): void => {

	if ( obstruction.defaults.cost ) {

		const check = game.localPlayer.checkResources( obstruction.defaults.cost );
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

export const stop = (): void => {

	if ( ! plannedObstruction ) return;
	plannedObstruction = undefined;
	arena.removeChild( container );
	if ( requestedAnimationFrame ) cancelAnimationFrame( requestedAnimationFrame );
	requestedAnimationFrame = undefined;

};

export const active = (): typeof plannedObstruction => plannedObstruction;

export const valid = (): boolean => !! plannedObstruction && pathable;
