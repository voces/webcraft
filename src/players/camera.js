
import game from "../index.js";
import { WORLD_TO_GRAPHICS_RATIO } from "../constants.js";
import tweenPoints from "../util/tweenPoints.js";

const CAMERA_SPEED = 300;

const arena = document.getElementById( "arena" );
let keyboard;
let knownRound;
let requestedAnimationFrame;
let pan;

window.addEventListener( "keydown", e => {

	if ( ! game.round ) return;

	if ( knownRound !== game.round ) {

		keyboard = {};
		lastRender = 0;

	}
	knownRound = game.round;

	if ( e.key.startsWith( "Arrow" ) && ! keyboard[ e.key ] ) {

		if ( pan ) pan = undefined;
		keyboard[ e.key ] = true;
		if ( ! requestedAnimationFrame ) renderCamera();

	}

} );

window.addEventListener( "keyup", e => {

	if ( ! game.round || ! keyboard ) return;

	if ( e.key.startsWith( "Arrow" ) )
		keyboard[ e.key ] = false;

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

		if ( Object.values( keyboard ).some( Boolean ) )
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
			{ x: arena.x, y: arena.y },
			{ x: xCenter - x, y: yCenter - y },
		] ),
		{ duration }
	);

	renderCamera();

};
