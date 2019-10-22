
import game from "../index.js";
import { WORLD_TO_GRAPHICS_RATIO } from "../constants.js";
import tweenPoints from "../util/tweenPoints.js";
import { document, requestAnimationFrame, window } from "../util/globals.js";
import dragSelect from "../sprites/dragSelect.js";

const CAMERA_SPEED = 800;
const ZOOM_SPEED = 1 / 500;

const arena = document.getElementById( "arena" );
const ui = document.getElementById( "ui" );
let keyboard = {};
let mouse = {};
let knownRound;
let requestedAnimationFrame;
let pan;

window.addEventListener( "keydown", e => {

	if ( e.key === "f" && e.ctrlKey ) {

		e.preventDefault();

		if ( followInterval ) {

			clearInterval( followInterval );
			followInterval = undefined;

		} else followInterval = setInterval( follow, 500 );

	}

	if ( ! game.round ) return;

	if ( knownRound !== game.round ) {

		keyboard = {};
		lastRender = 0;

	}
	knownRound = game.round;

	const key = e.key;
	if ( key.startsWith( "Arrow" ) && ! keyboard[ e.key ] ) {

		if ( pan ) pan = undefined;
		keyboard[ key ] = true;
		if ( ! requestedAnimationFrame ) renderCamera();

	}

} );

window.addEventListener( "keyup", e => {

	if ( ! game.round || ! keyboard ) return;

	const key = e.key;
	if ( key.startsWith( "Arrow" ) )
		keyboard[ key ] = false;

} );

const setMouseAndRender = direction => {

	if ( mouse[ direction ] ) return;
	if ( pan ) pan = undefined;
	mouse[ direction ] = true;
	renderCamera();

};

window.addEventListener( "mousemove", e => {

	if ( ui.contains( e.target ) ) return mouse = {};

	if ( e.pageX > window.innerWidth / 2 )

		if ( e.pageX > window.innerWidth - 64 ) setMouseAndRender( "right" );
		else mouse.right = false;

	else if ( e.pageX < 64 ) setMouseAndRender( "left" );
	else mouse.left = false;

	if ( e.pageY > window.innerHeight / 2 )

		if ( e.pageY > window.innerHeight - 64 ) setMouseAndRender( "down" );
		else mouse.down = false;

	else if ( e.pageY < 64 ) setMouseAndRender( "up" );
	else mouse.up = false;

} );

window.addEventListener( "mouseout", e => {

	if ( e.toElement || e.relatedTarget ) return;

	mouse = {};

} );

window.addEventListener( "wheel", e => {

	const oldHeight = arena.clientHeight * arena.scale;
	const oldWidth = arena.clientWidth * arena.scale;
	arena.scale = Math.max( arena.scale + e.deltaY * ZOOM_SPEED, 0.10 );
	arena.style.transform = `scale(${arena.scale})`;

	// We should find where the camera is and scale as if that is the origin
	// This just treats the center of the arena as the origin
	arena.style.top = ( arena.y += ( oldHeight - arena.clientHeight * arena.scale ) / 2 ) + "px";
	arena.style.left = ( arena.x += ( oldWidth - arena.clientWidth * arena.scale ) / 2 ) + "px";

} );

let lastRender = 0;
const renderCamera = time => {

	const delta = ( lastRender && time ? time - lastRender : 17 ) / 1000;
	lastRender = time;

	if ( pan ) {

		const { x, y } = pan.step( delta * pan.distance / pan.duration );

		arena.style.top = ( arena.y = y ) + "px";
		arena.style.left = ( arena.x = x ) + "px";

		if ( x !== pan.target.x || y !== pan.target.y )
			requestedAnimationFrame = requestAnimationFrame( renderCamera );
		else
			requestedAnimationFrame = undefined;

	} else {

		if ( keyboard.ArrowDown ) arena.style.top = ( arena.y = arena.y - delta * CAMERA_SPEED ) + "px";
		if ( keyboard.ArrowUp ) arena.style.top = ( arena.y = arena.y + delta * CAMERA_SPEED ) + "px";
		if ( keyboard.ArrowRight ) arena.style.left = ( arena.x = arena.x - delta * CAMERA_SPEED ) + "px";
		if ( keyboard.ArrowLeft ) arena.style.left = ( arena.x = arena.x + delta * CAMERA_SPEED ) + "px";

		if ( mouse.up ) arena.style.top = ( arena.y = arena.y + delta * CAMERA_SPEED ) + "px";
		if ( mouse.down ) arena.style.top = ( arena.y = arena.y - delta * CAMERA_SPEED ) + "px";
		if ( mouse.left ) arena.style.left = ( arena.x = arena.x + delta * CAMERA_SPEED ) + "px";
		if ( mouse.right ) arena.style.left = ( arena.x = arena.x - delta * CAMERA_SPEED ) + "px";

		if ( mouse.up )
			if ( mouse.left ) document.body.style.cursor = "nw-resize";
			else if ( mouse.right ) document.body.style.cursor = "ne-resize";
			else document.body.style.cursor = "n-resize";
		else if ( mouse.down )
			if ( mouse.left ) document.body.style.cursor = "sw-resize";
			else if ( mouse.right ) document.body.style.cursor = "se-resize";
			else document.body.style.cursor = "s-resize";
		else if ( mouse.left ) document.body.style.cursor = "w-resize";
		else if ( mouse.right ) document.body.style.cursor = "e-resize";
		else document.body.style.cursor = "";

		if ( Object.values( keyboard ).some( Boolean ) || Object.values( mouse ).some( Boolean ) )
			requestedAnimationFrame = requestAnimationFrame( renderCamera );
		else requestedAnimationFrame = undefined;

	}

};

export const panTo = ( { x, y, duration = 0.125 } ) => {

	x *= WORLD_TO_GRAPHICS_RATIO;
	y *= WORLD_TO_GRAPHICS_RATIO;

	const xCenter = window.innerWidth / 2;
	const yCenter = window.innerHeight / 2;

	pan = Object.assign(
		tweenPoints( [
			{ x: arena.x || 0, y: arena.y || 0 },
			{ x: xCenter - x, y: yCenter - y },
		] ),
		{ duration }
	);

	renderCamera();

};

let followInterval;
const follow = () => {

	if ( dragSelect.selection.length === 0 ) return;

	const { xSum, ySum } = dragSelect.selection.reduce(
		( { xSum, ySum }, { x, y } ) =>
			( { xSum: xSum + x, ySum: ySum + y } ),
		{ xSum: 0, ySum: 0 }
	);

	const x = xSum / dragSelect.selection.length;
	const y = ySum / dragSelect.selection.length;
	panTo( { x, y, duration: 10 } );

};
