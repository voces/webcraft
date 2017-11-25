
/////////////////////////////////////////////////
///// Overhead
////////////////////////////////////////////////

{

	const isBrowser = new Function( "try {return this===window;}catch(e){ return false;}" )() || process.env.isBrowser;

	//For Node (i.e., servers)
	if ( ! isBrowser ) {

		THREE = require( "three" );
		WebCraft = require( "../../../build/webcraft.js" );
		Multiboard = require( "../../ui/Multiboard.js" );

	}

}

/////////////////////////////////////////////////
///// Initialization
////////////////////////////////////////////////

const keyboard = {};

const speed = 6.25;

const Direction = {
	Right: 0,
	Up: Math.PI / 2,
	Left: Math.PI,
	Down: Math.PI * 3 / 2
};

const spawnLocations = [
	{ x: - 15, y: 6, facing: Direction.Right, speed },
	{ x: 15, y: 6, facing: Direction.Left, speed },
	{ x: - 15, y: 2, facing: Direction.Right, speed },
	{ x: 15, y: 2, facing: Direction.Left, speed },
	{ x: - 15, y: - 2, facing: Direction.Right, speed },
	{ x: 15, y: - 2, facing: Direction.Left, speed },
	{ x: - 15, y: - 6, facing: Direction.Right, speed },
	{ x: 15, y: - 6, facing: Direction.Left, speed }
];

const app = new WebCraft.App( {

	network: { host: "notextures.io", port: 8086 },

	types: {
		doodads: [ { name: "Wall", model: "../../models/Cube.js" } ],
		units: [
			{ name: "Bike", model: "../../models/Cube.js", state: [ "oldFacing" ] },
			{ name: "Glass", model: { path: "../../models/Cube.js", opacity: 0.5 } }
		]
	}

} );

new app.Wall( { model: { path: "../../models/Cube.js", width: 41 }, y: 10 } );
new app.Wall( { model: { path: "../../models/Cube.js", width: 41 }, y: - 10 } );
new app.Wall( { model: { path: "../../models/Cube.js", height: 21 }, x: 21 } );
new app.Wall( { model: { path: "../../models/Cube.js", height: 21 }, x: - 21 } );

let grid = [];
for ( let i = 0; i <= 40; i ++ ) grid[ i ] = {};

app.state = { players: app.players };

Object.defineProperties( app.state, {
	tick: {
		get: () => ticker && { interval: ticker.interval, nextTick: ticker.time },
		set: descriptor => ticker = typeof descriptor === "object" && descriptor !== null ? app.setInterval( tick, descriptor.interval, descriptor.nextTick ) : descriptor,
		enumerable: true
	},
	startTimer: {
		get: () => startTimer && startTimer.time,
		set: time => startTimer = typeof time === "number" ? app.setTimeout( start, time, true ) : time,
		enumerable: true
	},
	grid: { get: () => grid, set: value => grid = value, enumerable: true }
} );

let ticker;
let startTimer;

const multiboard = new Multiboard( {
	columns: 2,
	schema: [ "color.name", "score" ]
} );

/////////////////////////////////////////////////
///// Game Logic
/////////////////////////////////////////////////

function reset() {

	const units = [ ...app.units ];

	for ( let i = 0; i < units.length; i ++ )
		units[ i ].remove();

	for ( let x = 0; x <= 40; x ++ )
		grid[ x ] = {};

	app.players.filter( player => player.status === "left" ).forEach( player => player.remove() );

}

function start() {

	startTimer = undefined;

	reset();

	for ( let i = 0; i < app.players.length; i ++ ) {

		const bike = new app.Bike( Object.assign( { owner: app.players[ i ] }, spawnLocations[ i ] ) );
		app.players[ i ].bike = bike;

		bike.x = app.linearTween( { start: bike.x, rate: bike.speed * Math.cos( bike.facing ), duration: Infinity } );

		bike.oldFacing = bike.facing;

	}

	tick();
	ticker = app.setInterval( tick, 1000 / speed );

}

function tick() {

	let death = false;

	const bikes = app.units.filter( u => u instanceof app.Bike );
	for ( let i = 0; i < bikes.length; i ++ ) {

		const bike = bikes[ i ];

		const x = Math.round( bike.x );
		const y = Math.round( bike.y );

		if ( Math.abs( x ) < 21 && Math.abs( y ) < 10 && grid[ x + 20 ][ y + 9 ] === undefined )
			continue;

		death = true;
		bike.owner.bike = undefined;
		bike.kill();
		bikes.splice( bikes.indexOf( bike ), 1 );
		i --;

	}

	for ( let i = 0; i < bikes.length; i ++ ) {

		const bike = bikes[ i ];

		const x = Math.round( bike.x );
		const y = Math.round( bike.y );

		new app.Glass( { owner: bike.owner, x: x, y: y } );
		grid[ x + 20 ][ y + 9 ] = new app.Glass( { owner: bike.owner, x: x, y: y } );

		if ( bike.facing !== bike.oldFacing ) {

			if ( bike.facing === 0 || bike.facing === Math.PI ) {

				bike.x = app.linearTween( { start: x, rate: bike.speed * Math.cos( bike.facing ), duration: Infinity } );
				bike.y = y;

			} else {

				bike.x = x;
				bike.y = app.linearTween( { start: y, rate: bike.speed * Math.sin( bike.facing ), duration: Infinity } );

			}

			bike.oldFacing = bike.facing;

		}

	}

	if ( ! death || bikes.length > 1 ) return;

	if ( bikes.length === 0 ) {

		ticker = ticker.clear();
		startTimer = app.setTimeout( start, 1000 );
		return;

	}

	const winner = bikes[ 0 ].owner;

	++ winner.score;
	multiboard.update( app.players.here );

	winner.bike.x = winner.bike.x;
	winner.bike.y = winner.bike.y;

	ticker = ticker.clear();

	if ( app.players.length >= 2 )
		startTimer = app.setTimeout( start, 1000 );

}

/////////////////////////////////////////////////
///// Game Events
/////////////////////////////////////////////////

function onNewPlayer( player ) {

	player.state = [ "bike", "score" ];
	if ( player.score === undefined ) player.score = 0;

	multiboard.colors = app.players.here.map( player => player.color.hex );
	multiboard.update( app.players.here );

}

app.addEventListener( "playerJoin", ( { player } ) => {

	if ( app.players.length === 2 )
		startTimer = app.setTimeout( start, 1000 );

	onNewPlayer( player );

} );

app.addEventListener( "state", () => {

	if ( ! WebCraft.isBrowser ) return;

	for ( let i = 0; i < app.players.length; i ++ )
		onNewPlayer( app.players[ i ] );

	if ( app.players.length === 2 )
		startTimer = app.setTimeout( start, 1000 );

} );

app.addEventListener( "playerLeave", ( { player } ) => {

	// Kill the leaver's bike
	if ( player.bike ) {

		player.bike.kill();
		player.bike = undefined;

		// Leaver was the last opponent; award points to the winner and freeze the game
		const bikes = app.units.filter( u => u instanceof app.Bike );
		if ( bikes.length === 1 ) {

			const winner = bikes[ 0 ].owner;

			++ winner.score;

			winner.bike.x = winner.bike.x;
			winner.bike.y = winner.bike.y;

			if ( ticker ) ticker = ticker.clear();

		// Leaver was the winner; cancel ticker if going and start the next round if we can

		} else if ( bikes.length === 0 && ticker ) ticker = ticker.clear();

	}

	// Between rounds
	if ( ! ticker ) {

		if ( startTimer ) startTimer = startTimer.clear();

		if ( app.players.length >= 2 )
			startTimer = app.setTimeout( start, 1000 );

	}

	multiboard.colors = app.players.here.map( player => player.color.hex );
	multiboard.update( app.players.here );

} );

/////////////////////////////////////////////////
///// Player Actions
/////////////////////////////////////////////////

app.addEventListener( "up down left right", ( { type, player } ) => {

	const bike = player.bike;
	const direction = type.replace( type[ 0 ], type[ 0 ].toUpperCase() );

	if ( ! bike ) return;

	if ( Math.abs( ( ( bike.oldFacing + Math.PI ) % ( Math.PI * 2 ) ) - Direction[ direction ] ) < 1e-6 || bike.facing !== bike.oldFacing )
		return;

	bike.facing = Direction[ direction ];

} );

WebCraft.isBrowser && window.addEventListener( "keydown", e => {

	if ( keyboard[ e.key ] ) return;
	keyboard[ e.key ] = true;

	if ( ! app.localPlayer || ! app.localPlayer.bike ) return;

	const eventType = e.key === "ArrowUp" && "up" ||
		e.key === "ArrowDown" && "down" ||
		e.key === "ArrowLeft" && "left" ||
		e.key === "ArrowRight" && "right";

	if ( ! eventType ) return;

	app.network.send( { type: eventType } );

} );

WebCraft.isBrowser && window.addEventListener( "keyup", e => {

	if ( ! keyboard[ e.key ] ) return;
	keyboard[ e.key ] = false;

} );
