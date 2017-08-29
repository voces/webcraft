
/////////////////////////////////////////////////
///// Overhead
////////////////////////////////////////////////

{

	const isBrowser = new Function( "try {return this===window;}catch(e){ return false;}" )();

	//For Node (i.e., servers)
	if ( ! isBrowser ) {

		THREE = require( "three" );
		WebCraft = require( "../../../build/webcraft.js" );

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
			{ name: "Bike", model: "../../models/Cube.js" },
			{ name: "Glass", model: { path: "../../models/Cube.js", opacity: 0.5 } }
		]
	},

	intentSystem: {

		keydown: e => {

			if ( keyboard[ e.key ] ) return;
			keyboard[ e.key ] = true;

			if ( ! app.localPlayer || ! app.localPlayer.bike ) return;

			const eventType = e.key === "ArrowUp" && "up" ||
				e.key === "ArrowDown" && "down" ||
				e.key === "ArrowLeft" && "left" ||
				e.key === "ArrowRight" && "right";

			if ( ! eventType ) return;

			app.network.send( { type: eventType } );

		},

		keyup: e => {

			if ( ! keyboard[ e.key ] ) return;
			keyboard[ e.key ] = false;

		}

	}

} );

new app.Wall( { model: { path: "../../models/Cube.js", width: 41 }, y: 10 } );
new app.Wall( { model: { path: "../../models/Cube.js", width: 41 }, y: - 10 } );
new app.Wall( { model: { path: "../../models/Cube.js", height: 21 }, x: 21 } );
new app.Wall( { model: { path: "../../models/Cube.js", height: 21 }, x: - 21 } );

let bikes = [];
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
	scores: {
		get: () => app.players.here.slice( 0, 8 ).map( player => player.score || 0 ),
		set: scores => scores.forEach( ( score, i ) => app.players.here[ i ].score = score ),
		enumerable: true
	},
	bikes: { get: () => bikes, set: value => bikes = value, enumerable: true },
	grid: { get: () => grid, set: value => grid = value, enumerable: true }
} );

let ticker;
let startTimer;

/////////////////////////////////////////////////
///// Game Logic
/////////////////////////////////////////////////

function reset() {

	const units = [ ...app.units ];

	for ( let i = 0; i < units.length; i ++ )
		units[ i ].remove();

	for ( let x = 0; x <= 40; x ++ )
		grid[ x ] = {};

	bikes.splice( 0 );

	app.players.filter( player => player.status === "left" ).forEach( player => player.remove() );

}

function start() {

	startTimer = undefined;

	reset();

	const players = app.players.here.slice( 0, 8 );

	for ( let i = 0; i < players.length; i ++ ) {

		const bike = new app.Bike( Object.assign( { owner: players[ i ] }, spawnLocations[ i ] ) );
		players[ i ].bike = bike;
		bikes.push( bike );

		bike.x = app.linearTween( { start: bike.x, rate: bike.speed * Math.cos( bike.facing ), duration: Infinity } );

		bike.oldFacing = bike.facing;

		if ( WebCraft.isBrowser )
			players[ i ].scoreSpan.textContent = players[ i ].score;

	}

	tick();
	ticker = app.setInterval( tick, 1000 / speed );

}

function tick() {

	let death = false;

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

	winner.bike.x = winner.bike.x;
	winner.bike.y = winner.bike.y;

	ticker = ticker.clear();

	if ( app.players.here.length >= 2 )
		startTimer = app.setTimeout( start, 1000 );

}

/////////////////////////////////////////////////
///// Game Events
/////////////////////////////////////////////////

function onNewPlayer( player ) {

	if ( player.score === undefined ) player.score = 0;

	if ( WebCraft.isBrowser && app.players.here.slice( 0, 8 ).indexOf( player ) >= 0 ) addPlayerToLeaderboard( player );

}

app.addEventListener( "playerJoin", ( { player } ) => {

	if ( app.players.here.length === 2 )
		startTimer = app.setTimeout( start, 1000 );

	onNewPlayer( player );

} );

app.addEventListener( "state", e => {

	if ( ! WebCraft.isBrowser ) return;

	for ( let i = 0; i < e.state.bikes.length; i ++ ) {

		e.state.bikes[ i ].owner.bike = e.state.bikes[ i ];
		e.state.bikes[ i ].oldFacing = e.state.bikes[ i ].facing;

	}

	const players = app.players.here;
	for ( let i = 0; i < players.length; i ++ )
		onNewPlayer( players[ i ] );

	if ( players.length === 2 )
		startTimer = app.setTimeout( start, 1000 );

} );

app.addEventListener( "playerLeave", ( { player } ) => {

	// Kill the leaver's bike
	if ( player.bike ) {

		player.bike.kill();
		bikes.splice( bikes.indexOf( player.bike ), 1 );
		player.bike = undefined;

		// Leaver was the last opponent; award points to the winner and freeze the game
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

		if ( app.players.here.length >= 2 )
			startTimer = app.setTimeout( start, 1000 );

	}

	if ( WebCraft.isBrowser && player.leaderboardRow ) {

		player.leaderboardRow.remove();

		const players = app.players.here;
		if ( players.length >= 8 ) addPlayerToLeaderboard( players[ 7 ] );

	}

} );

/////////////////////////////////////////////////
///// Leaderboard
/////////////////////////////////////////////////

function addPlayerToLeaderboard( player ) {

	const container = document.createElement( "div" );
	container.classList.add( "row" );
	container.style.color = player.color.hex;
	document.querySelector( ".leaderboard" ).appendChild( container );

	const name = document.createElement( "span" );
	name.classList.add( "player" );
	name.textContent = ( player === app.localPlayer ? "►" : "" ) + player.color.name;
	container.appendChild( name );

	const score = document.createElement( "span" );
	score.classList.add( "score" );
	score.textContent = player.score;
	container.appendChild( score );

	player.scoreSpan = score;
	player.leaderboardRow = container;

}

/////////////////////////////////////////////////
///// Player Actions
/////////////////////////////////////////////////

app.addEventListener( "up down left right", bikeEvent );

function bikeEvent( { type, player } ) {

	const bike = player.bike;
	const direction = type.replace( type[ 0 ], type[ 0 ].toUpperCase() );

	if ( ! bike ) return;

	if ( Math.abs( ( ( bike.oldFacing + Math.PI ) % ( Math.PI * 2 ) ) - Direction[ direction ] ) < 1e-6 || bike.facing !== bike.oldFacing )
		return;

	bike.facing = Direction[ direction ];

}
