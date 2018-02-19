
import * as WebCraft from "../../../src/webcraft.js";

// delayed import
const di = path => () => import( path );

/////////////////////////////////////////////////
///// Initialization
////////////////////////////////////////////////

const keyboard = {};

const app = new WebCraft.App( {

	base: typeof location !== "undefined" ? location.href.split( "/" ).slice( 0, - 1 ).join( "/" ) : __dirname,

	network: { host: "notextures.io", port: 8086 },

	types: {
		doodads: [ { name: "Wall", model: { mesh: di( "../../models/CubeModel.js" ), width: 26 } } ],
		units: [
			{ name: "Ball", model: { mesh: di( "../../models/SphereModel.js" ), color: "#00FF00" } },
			{ name: "Paddle", model: { mesh: di( "../../models/CubeModel.js" ), height: 5 } }
		]
	},

	camera: {
		angleOfAttack: 0,
		z: 35,
		controls: false
	}

} );

new app.Wall( { y: 7.5 } );
new app.Wall( { y: - 7.5 } );

const ball = new app.Ball();

const leftPaddle = new app.Paddle( { x: - 12.5 } );
const rightPaddle = new app.Paddle( { x: 12.5 } );

const bounceRegion = new app.Rect( { x: 11.5, y: 6.5 }, { x: - 11.5, y: - 6.5 } );
const scoreRegion = new app.Rect( { x: 13.5, y: 100 }, { x: - 13.5, y: - 100 } );

Object.assign( app.state, {
	leftScore: 0, rightScore: 0
} );

Object.defineProperty( app.state, "start", {
	get: () => startTimeout && startTimeout.time,
	set: time => startTimeout = time ? app.setTimeout( start, time, true ) : null,
	enumerable: true
} );

let startTimeout;

/////////////////////////////////////////////////
///// Game Logic
/////////////////////////////////////////////////

function randomAngle() {

	const random = ( app.random() - 0.5 ) * ( app.random() - 0.5 ) * 2,
		dir = parseInt( random.toString()[ 15 ] ) % 2;

	return dir ? random : random + Math.PI;

}

function reset() {

	app.players.filter( player => player.status === "left" ).forEach( player => player.remove() );

	if ( ! WebCraft.isBrowser ) return;

	app.state.leftScore = app.state.rightScore = document.getElementById( "left-score" ).textContent = document.getElementById( "right-score" ).textContent = 0;

}

function init() {

	const players = app.players.filter( player => player.status === "here" );

	leftPaddle.owner = players[ 0 ];
	rightPaddle.owner = players[ 1 ];

}

function start() {

	const facing = randomAngle();

	ball.facing = facing;
	ball.x = app.linearTween( { start: 0, rate: 10 * Math.cos( facing ), duration: Infinity } );
	ball.y = app.linearTween( { start: 0, rate: 10 * Math.sin( facing ), duration: Infinity } );

	leftPaddle.y = 0;
	rightPaddle.y = 0;

}

function angleWeightedAverage( angles, weights ) {

	let x = 0;
	let y = 0;

	for ( let i = 0; i < angles.length; i ++ ) {

		x += Math.cos( angles[ i ] ) * weights[ i ];
		y += Math.sin( angles[ i ] ) * weights[ i ];

	}

	return Math.atan2( y, x );

}

bounceRegion.addEventListener( "unitLeave", () => {

	if ( Math.abs( ball.y ) >= 6.5 - 1e-7 ) {

		ball.facing = Math.PI * 2 - ball.facing;
		ball.y = app.linearTween( { start: ball.y, rate: - ball._props.y.rate, duration: Infinity } );

		return;

	}

	let diff;
	if ( ( ball.x >= 11.5 - 1e-7 && ( diff = rightPaddle.y - ball.y ) || ( ball.x <= - 11.5 + 1e-7 && ( diff = leftPaddle.y - ball.y ) ) ) && Math.abs( diff ) < 2.5 ) {

		const reflectionAngle = Math.PI - ball.facing;
		const sportAngle = diff < 0 ? Math.PI / 2 : - Math.PI / 2;

		ball.facing = angleWeightedAverage( [ reflectionAngle, sportAngle ], [ 1, Math.abs( diff ) / 2.5 ] );

		ball.x = app.linearTween( { start: ball.x, rate: 10 * Math.cos( ball.facing ), duration: Infinity } );
		ball.y = app.linearTween( { start: ball.y, rate: 10 * Math.sin( ball.facing ), duration: Infinity } );

	}

} );

scoreRegion.addEventListener( "unitLeave", () => {

	const winner = ball.x < 0 ? rightPaddle.owner : leftPaddle.owner;

	const prefix = winner === leftPaddle.owner ? "left" : "right";

	++ app.state[ prefix + "Score" ];
	if ( WebCraft.isBrowser )
		document.getElementById( prefix + "-score" ).textContent = app.state[ prefix + "Score" ];

	ball.x = ball.x;
	ball.y = ball.y;

	startTimeout = app.setTimeout( start, 1000 );

} );

/////////////////////////////////////////////////
///// Game Events
/////////////////////////////////////////////////

app.addEventListener( "playerJoin", () => {

	if ( ! WebCraft.isServer || app.players.filter( player => player.status === "here" ).length !== 2 ) return;

	app.setTimeout( () => ( app.network.send( { type: "start" } ), app.dispatchEvent( "start" ) ), 1000 );

} );

app.addEventListener( "start", () => {

	reset();
	init();
	start();

} );

app.addEventListener( "playerLeave", e => {

	if ( e.player !== leftPaddle.owner && e.player !== rightPaddle.owner ) return e.player.remove();

	if ( startTimeout ) startTimeout.clear();
	startTimeout = undefined;

	ball.x = ball.x;
	ball.y = ball.y;

	reset();

	if ( app.players.filter( player => player.status === "here" ).length < 2 ) return;

	init();

	startTimeout = app.setTimeout( () => start(), 1000 );

} );

app.addEventListener( "state", e => {

	if ( ! WebCraft.isBrowser ) return;

	if ( e.state.leftScore !== undefined ) document.getElementById( "left-score" ).textContent = app.state.leftScore;
	if ( e.state.rightScore !== undefined ) document.getElementById( "right-score" ).textContent = app.state.rightScore;

} );

/////////////////////////////////////////////////
///// Player Actions
/////////////////////////////////////////////////

app.addEventListener( "up down hold", ( { type, player } ) => {

	const paddle = leftPaddle.owner === player && leftPaddle || rightPaddle.owner === player && rightPaddle;

	if ( ! paddle ) return;

	switch ( type ) {

		case "up": return paddle.y = app.linearTween( { start: paddle.y, end: 4.5, rate: 5 } );
		case "down": return paddle.y = app.linearTween( { start: paddle.y, end: - 4.5, rate: - 5 } );
		case "hold": return paddle.y = paddle.y;

	}

} );

WebCraft.isBrowser && window.addEventListener( "keydown", e => {

	if ( keyboard[ e.key ] ) return;
	keyboard[ e.key ] = true;

	if ( leftPaddle.owner !== app.localPlayer && rightPaddle.owner !== app.localPlayer ) return;

	const type = e.key === "ArrowUp" && "up" || e.key === "ArrowDown" && "down";

	if ( ! type ) return;

	app.network.send( { type } );

} );

WebCraft.isBrowser && window.addEventListener( "keyup", e => {

	if ( ! keyboard[ e.key ] ) return;
	keyboard[ e.key ] = false;

	if ( leftPaddle.owner !== app.localPlayer && rightPaddle.owner !== app.localPlayer ) return;

	if ( ! keyboard.ArrowUp && ! keyboard.ArrowDown && [ "ArrowUp", "ArrowDown" ].includes( e.key ) )
		app.network.send( { type: "hold" } );

} );

export default app;

if ( typeof window === "object" ) window.app = app;
