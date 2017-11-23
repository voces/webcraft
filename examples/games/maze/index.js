
/////////////////////////////////////////////////
///// Overhead
////////////////////////////////////////////////

{

	const isBrowser = new Function( "try {return this===window;}catch(e){ return false;}" )() || process.env.isBrowser;

	// For Node (i.e., servers)
	if ( ! isBrowser ) {

		THREE = require( "three" );
		WebCraft = require( "../../../build/webcraft.js" );
		Multiboard = require( "../../shared/ui/Multiboard.js" );
		Chat = require( "../../shared/ui/Chat.js" );

	}

}

/////////////////////////////////////////////////
///// Initialization
////////////////////////////////////////////////

const keyboard = {};

const SIZE = 0.5;

const app = new WebCraft.App( {

	network: { host: "notextures.io", port: 8086 },

	types: {
		doodads: [
			{ name: "Green", model: { path: "../../models/Cube.js", color: "#B5FEB4" } },
			{ name: "TileWhite", model: { path: "../../models/Cube.js", color: "#F7F7FF" } },
			{ name: "TileGray", model: { path: "../../models/Cube.js", color: "#E6E6FF" } }
		],
		units: [
			{ name: "Character", model: { path: "../../models/Cube.js", scale: SIZE }, speed: 3.5 },
			{ name: "Food", model: { path: "../../models/Sphere.js", color: "#FFFF00", scale: 0.5 }, state: [ "food" ] },
			{ name: "Enemy", model: { path: "../../models/Sphere.js", color: "#0000FF", scale: 0.5 }, speed: 7 }
		]
	}
} );

app.state = { players: app.players, units: app.units, doodads: app.doodads, levelIndex: 0 };

const multiboard = new Multiboard( {
	columns: 2,
	schema: [ "color.name", "points" ],
	colors: app.Player.colors.map( color => color.hex )
} );

new Chat( app );

/////////////////////////////////////////////////
///// Game Logic
/////////////////////////////////////////////////

function spawn( player ) {

	const level = levels[ app.state.levelIndex ];

	if ( level.checkpoints === undefined ) calculateCheckpoints();

	const char = new app.Character( Object.assign( { owner: player, z: 1 }, level.checkpoints[ player.checkpoint ].center ) );
	player.character = char;
	char.onNear( app.units, SIZE, onNear );
	char.addEventListener( "death", onDeath );

}

function cleanup() {

	const level = levels[ app.state.levelIndex ];

	if ( typeof level.clean === "function" ) level.clean();

	const units = [ ...app.units ];
	for ( let i = 0; i < units.length; i ++ )
		units[ i ].remove();

	const doodads = [ ...app.doodads ];
	for ( let i = 0; i < doodads.length; i ++ )
		doodads[ i ].remove();

	for ( let i = 0; i < app.players.length; i ++ )
		app.players[ i ].food = [];

}

function start() {

	cleanup();

	app.state.levelIndex = Math.floor( app.random() * levels.length );

	const level = levels[ app.state.levelIndex ];
	if ( level.checkpoints === undefined ) calculateCheckpoints();
	if ( typeof level.start === "function" ) level.start();

	const base = {};
	if ( level.speed ) base.speed = level.speed;

	for ( let i = 0; i < app.players.length; i ++ ) {

		app.players[ i ].checkpoint = level.spawn;
		spawn( app.players[ i ] );

	}

	for ( let y = 0; y < level.floormap.length; y ++ )
		for ( let x = 0; x < level.floormap[ y ].length; x ++ ) {

			const tile = level.floormap[ y ][ x ];

			const klass = tile === "░" ? app.Green :
				tile === " " ? ( ( x + y ) % 2 === 0 ? app.TileWhite : app.TileGray ) : undefined;

			if ( ! klass ) continue;

			new klass( tileToWorld( x, y ) );

		}

	if ( level.stills )
		for ( let i = 0; i < level.stills.length; i ++ )
			new app.Enemy( Object.assign( { z: 1 }, base, offset( level.stills[ i ] ) ) );

	if ( level.patrols )
		for ( let i = 0; i < level.patrols.length; i ++ ) {

			const unit = new app.Enemy( Object.assign( { z: 1 }, base, offset( level.patrols[ i ][ 0 ] ) ) );
			unit.patrol( level.patrols[ i ].map( p => offset( p ) ) );

		}

	if ( level.circles )
		for ( let i = 0; i < level.circles.length; i ++ ) {

			const center = offset( level.circles[ i ] );

			const unit = new app.Enemy( Object.assign( { z: 1 }, base, center ) );
			unit.circle = {
				radius: level.circles[ i ].radius || 1,
				duration: level.circles[ i ].duration || 1,
				center,
				offset: level.circles[ i ].offset || 0
			};
			unit.state = [ "circle" ];

		}

	if ( level.food )
		for ( let i = 0; i < level.food.length; i ++ )
			Object.assign( new app.Food( Object.assign( { z: 1 }, level.food[ i ], offset( level.food[ i ] ) ) ), { food: i } );

	if ( WebCraft.isBrowser ) app.camera.position.z = Math.max( level.width / 2 + 10, level.height );

	app.updates.push( tick );

}

function onDeath() {

	const player = this.owner;
	const level = levels[ app.state.levelIndex ];

	for ( let i = 0; i < player.food.length; i ++ )
		if ( player.food[ i ] )
			Object.assign( new app.Food( Object.assign( { z: 1 }, level.food[ i ], offset( level.food[ i ] ) ) ), { food: i } );

	player.food = [];

	this.remove();

	spawn( player );

}

function onNear( e ) {

	const character = e.target;
	const player = character.owner;

	for ( let i = 0; i < e.nears.length; i ++ )
		if ( e.nears[ i ] instanceof app.Enemy ) character.kill();
		else if ( e.nears[ i ] instanceof app.Food ) {

			player.food[ e.nears[ i ].food ] = true;
			e.nears[ i ].remove();

		}

}

let lastTime;
function tick( time ) {

	const level = levels[ app.state.levelIndex ];
	if ( ! level ) return;

	const delta = ( time - lastTime ) / 1000;
	lastTime = time;

	for ( let i = 0; i < app.players.length; i ++ )
		if ( app.players[ i ].character ) {

			const player = app.players[ i ];

			const xDelta = ( ( player.ArrowRight ? 1 : 0 ) - ( player.ArrowLeft ? 1 : 0 ) ) * player.character.speed * delta;
			const yDelta = ( ( player.ArrowUp ? 1 : 0 ) - ( player.ArrowDown ? 1 : 0 ) ) * player.character.speed * delta;

			if ( xDelta && canPlace( player.character, xDelta, 0 ) ) player.character.x = roundTo( player.character.x + xDelta, 4 );
			if ( yDelta && canPlace( player.character, 0, yDelta ) ) player.character.y = roundTo( player.character.y + yDelta, 4 );

			for ( let n = 0; n < level.checkpoints.length; n ++ )
				if ( level.checkpoints[ n ].contains( player.character ) ) {

					player.checkpoint = n;

					if ( level.score !== n ) continue;

					if ( level.won === undefined ||
						typeof level.won === "number" && app.players.reduce( ( sum, p ) => sum + p.food.filter( f => f ).length, 0 ) >= level.won ||
						typeof level.won === "function" && level.won( player ) )

						point( app.players.filter( p => p === player || p.food.some( f => f ) ) );

				}

		}

	const circles = app.units.filter( u => u instanceof app.Enemy && u.circle );
	for ( let i = 0; i < circles.length; i ++ ) {

		const info = circles[ i ].circle;

		circles[ i ].x = info.center.x + Math.cos( - 2 * Math.PI * ( time / 1000 + info.offset ) / info.duration ) * info.radius;
		circles[ i ].y = info.center.y + Math.sin( - 2 * Math.PI * ( time / 1000 + info.offset ) / info.duration ) * info.radius;

	}

	if ( typeof level.tick === "function" ) level.tick( time, delta );

}
tick.count = 0;

function point( players ) {

	app.updates.splice( app.updates.indexOf( tick ), 1 );

	players.forEach( p => ++ p.points );
	multiboard.update( app.players );

	start();

}

/////////////////////////////////////////////////
///// Server Events
/////////////////////////////////////////////////

function newPlayer( player ) {

	player.food = [];
	player.state = [ "character", "points", "checkpoint" ];
	if ( player.points === undefined ) player.points = 0;
	if ( player.checkpoint === undefined ) player.checkpoint = levels[ app.state.levelIndex ].spawn;

	if ( app.players.length === 1 ) start();
	else {

		if ( player.character === undefined ) spawn( player );
		else if ( player.character._onNearsAnotherUnit === undefined ) {

			player.character.onNear( app.units, SIZE, onNear );
			player.character.addEventListener( "death", onDeath );

		}

		if ( player === app.localPlayer ) app.updates.push( tick );

		const level = levels[ app.state.levelIndex ];
		if ( WebCraft.isBrowser ) app.camera.position.z = Math.max( level.width / 2 + 10, level.height );

	}

	++ multiboard.rows;
	multiboard.update( app.players );

}

app.addEventListener( "playerJoin", ( { player } ) => {

	newPlayer( player );

} );

app.addEventListener( "state", ( { state } ) => {

	for ( let i = 0; i < state.players.length; i ++ )
		newPlayer( state.players[ i ] );

} );

app.addEventListener( "playerLeave", ( { player } ) => {

	if ( player.character ) {

		player.character.remove();
		delete player.character;

	}

	player.remove();

	-- multiboard.rows;
	multiboard.update( app.players );

	if ( app.players.length === 0 )
		cleanup();

} );

/////////////////////////////////////////////////
///// Player Actions
/////////////////////////////////////////////////

app.addEventListener( "keydown", ( { direction, player } ) => player[ direction ] = true );
app.addEventListener( "keyup", ( { direction, player } ) => player[ direction ] = false );

WebCraft.isBrowser && window.addEventListener( "keydown", e => {

	if ( keyboard[ e.key ] ) return;
	keyboard[ e.key ] = true;

	if ( [ "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight" ].indexOf( e.key ) === - 1 ) return;

	app.network.send( { type: "keydown", direction: e.key } );

} );

WebCraft.isBrowser && window.addEventListener( "keyup", e => {

	if ( ! keyboard[ e.key ] ) return;
	keyboard[ e.key ] = false;

	if ( [ "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight" ].indexOf( e.key ) === - 1 ) return;

	app.network.send( { type: "keyup", direction: e.key } );

} );

/////////////////////////////////////////////////
///// Levels
/////////////////////////////////////////////////

const levels = [

	// Level 1
	{
		spawn: 0,
		score: 1,
		floormap: [
			"██████████████████████",
			"██░░░██████████  ░░░██",
			"██░░░█          █░░░██",
			"██░░░█          █░░░██",
			"██░░░█          █░░░██",
			"██░░░█          █░░░██",
			"██░░░  ██████████░░░██",
			"██████████████████████"
		],
		patrols: [
			[ { x: - 4.5, y: - 1.5 }, { x: 4.5, y: - 1.5 } ],
			[ { x: 4.5, y: - 0.5 }, { x: - 4.5, y: - 0.5 } ],
			[ { x: - 4.5, y: 0.5 }, { x: 4.5, y: 0.5 } ],
			[ { x: 4.5, y: 1.5 }, { x: - 4.5, y: 1.5 } ]
		]
	},

	// Level 2
	{
		spawn: 0,
		score: 1,
		speed: 6,
		won: 1,
		floormap: [
			"████████████████████",
			"████            ████",
			"████            ████",
			"█░░░            ░░░█",
			"█░░░            ░░░█",
			"████            ████",
			"████            ████",
			"████████████████████"
		],
		patrols: [
			[ { x: - 5.5, y: - 2.5 }, { x: - 5.5, y: 2.5 } ],
			[ { x: - 4.5, y: 2.5 }, { x: - 4.5, y: - 2.5 } ],
			[ { x: - 3.5, y: - 2.5 }, { x: - 3.5, y: 2.5 } ],
			[ { x: - 2.5, y: 2.5 }, { x: - 2.5, y: - 2.5 } ],
			[ { x: - 1.5, y: - 2.5 }, { x: - 1.5, y: 2.5 } ],
			[ { x: - 0.5, y: 2.5 }, { x: - 0.5, y: - 2.5 } ],
			[ { x: 0.5, y: - 2.5 }, { x: 0.5, y: 2.5 } ],
			[ { x: 1.5, y: 2.5 }, { x: 1.5, y: - 2.5 } ],
			[ { x: 2.5, y: - 2.5 }, { x: 2.5, y: 2.5 } ],
			[ { x: 3.5, y: 2.5 }, { x: 3.5, y: - 2.5 } ],
			[ { x: 4.5, y: - 2.5 }, { x: 4.5, y: 2.5 } ],
			[ { x: 5.5, y: 2.5 }, { x: 5.5, y: - 2.5 } ]
		],
		food: [ { x: 0, y: 0 } ]
	},

	// Level 3
	{
		origin: { x: 0, y: - 0.5 },
		spawn: 0,
		score: 0,
		speed: 4,
		won: 1,
		floormap: [
			"██████",
			"█ ████",
			"█    █",
			"█ ░░ █",
			"█ ░░ █",
			"█    █",
			"██████"
		],
		patrols: [
			[ { x: - 1.5, y: 1.5 }, { x: 1.5, y: 1.5 }, { x: 1.5, y: - 1.5 }, { x: - 1.5, y: - 1.5 } ],
			[ { x: 1.5, y: 1.5 }, { x: 1.5, y: - 1.5 }, { x: - 1.5, y: - 1.5 }, { x: - 1.5, y: 1.5 } ],
			[ { x: 1.5, y: - 1.5 }, { x: - 1.5, y: - 1.5 }, { x: - 1.5, y: 1.5 }, { x: 1.5, y: 1.5 } ],
			[ { x: - 1.5, y: - 1.5 }, { x: - 1.5, y: 1.5 }, { x: 1.5, y: 1.5 }, { x: 1.5, y: - 1.5 } ],
			[ { x: - 0.5, y: 1.5 }, { x: 1.5, y: 1.5 }, { x: 1.5, y: - 1.5 }, { x: - 1.5, y: - 1.5 }, { x: - 1.5, y: 1.5 } ],
			[ { x: 0.5, y: 1.5 }, { x: 1.5, y: 1.5 }, { x: 1.5, y: - 1.5 }, { x: - 1.5, y: - 1.5 }, { x: - 1.5, y: 1.5 } ],
			[ { x: 1.5, y: 0.5 }, { x: 1.5, y: - 1.5 }, { x: - 1.5, y: - 1.5 }, { x: - 1.5, y: 1.5 }, { x: 1.5, y: 1.5 } ],
			[ { x: 1.5, y: - 0.5 }, { x: 1.5, y: - 1.5 }, { x: - 1.5, y: - 1.5 }, { x: - 1.5, y: 1.5 }, { x: 1.5, y: 1.5 } ],
			[ { x: 0.5, y: - 1.5 }, { x: - 1.5, y: - 1.5 }, { x: - 1.5, y: 1.5 }, { x: 1.5, y: 1.5 }, { x: 1.5, y: - 1.5 } ],
			[ { x: - 0.5, y: - 1.5 }, { x: - 1.5, y: - 1.5 }, { x: - 1.5, y: 1.5 }, { x: 1.5, y: 1.5 }, { x: 1.5, y: - 1.5 } ]],
		food: [ { x: - 1.5, y: 2.5 } ]
	},

	// Level 4
	{
		origin: { x: 1.5, y: - 1.5 },
		spawn: 0,
		score: 1,
		won: 3,
		floormap: [
			"█████████████",
			"███████░░████",
			"███████░░████",
			"███████░░████",
			"██████    ███",
			"█████      ██",
			"████        █",
			"█░░░        █",
			"█░░░        █",
			"████        █",
			"█████      ██",
			"██████    ███",
			"█████████████"
		],
		patrols: [[ { x: 0, y: 0 } ]],
		circles: [].concat( ...[ 0, 0.25, 0.5, 0.75 ].map( offset => [ 0.5, 1, 1.5, 2, 2.5, 3, 3.5 ].map( radius => ( {
			x: 0, y: 0, radius, duration: 3.25, offset: 3.25 * offset
		} ) ) ) ),
		food: [
			{ x: 0, y: 3 },
			{ x: 3, y: 0 },
			{ x: 0, y: - 3 }
		]
	},

	// Level 5
	{
		origin: { x: 0.5, y: 0 },
		spawn: 0,
		score: 3,
		floormap: [
			"███████████████████",
			"█░░              ░█",
			"████████████████ ██",
			"█░             █ ██",
			"███ ██████████ █ ██",
			"███ █       ░█ █ ██",
			"███ █ █     ░█ █ ██",
			"███ █ ████████ █ ██",
			"███ █          █ ██",
			"███ ████████████ ██",
			"███              ██",
			"███████████████████"
		],
		circles: [].concat( ...[ 0, 0.25, 0.5, 0.75 ].map( offset => [ 0.25, 0.5, 0.75, 1 ].map( radius => ( {
			x: 0, y: 0, radius: radius * 7.5, duration: 5, offset: 5 * offset
		} ) ) ) )
	},

	// Level 6
	{
		origin: { x: 1, y: 0 },
		spawn: 0,
		score: 2,
		floormap: [
			"████████████████████",
			"█░░                █",
			"█░░                █",
			"███                █",
			"███                █",
			"███████████████░░░░█",
			"███████████████░░░░█",
			"███                █",
			"███                █",
			"█░░                █",
			"█░░                █",
			"████████████████████"
		],
		patrols: [].concat( ...[ - 5.75, - 1.917, 1.917, 5.75 ].map( x => [ 3, - 3 ].map( y => [ { x, y } ] ) ) ),
		circles: [].concat( ...[ - 5.75, - 1.917, 1.917, 5.75 ].map( x => [].concat( ...[ 3, - 3 ].map( y => [].concat( ...[ 0, 0.25, 0.5, 0.75 ].map( arm => [ 0.95, 1.9 ].map( radius => ( {
			x, y: y, radius, duration: 4, offset: 4 * arm
		} ) ) ) ) ) ) ) ),
		food: [
			{ x: - 7.5, y: - 1.5 },
			{ x: - 3.5, y: - 1.5 },
			{ x: 0.5, y: - 1.5 },
			{ x: 4.5, y: - 1.5 }
		],
		won: 4
	},

	// Level 7
	{
		spawn: 0,
		score: 1,
		speed: 8,
		won: 4,
		floormap: [
			"████████████████████",
			"████            ████",
			"████            ████",
			"████            ████",
			"█░░░            ░░░█",
			"█░░░            ░░░█",
			"████            ████",
			"████            ████",
			"████            ████",
			"████████████████████"
		],
		patrols: [
			[ { x: - 5.5, y: - 3.5 }, { x: - 5.5, y: 3.5 } ],
			[ { x: - 4.5, y: 3.5 }, { x: - 4.5, y: - 3.5 } ],
			[ { x: - 3.5, y: - 3.5 }, { x: - 3.5, y: 3.5 } ],
			[ { x: - 2.5, y: 3.5 }, { x: - 2.5, y: - 3.5 } ],
			[ { x: - 1.5, y: - 3.5 }, { x: - 1.5, y: 3.5 } ],
			[ { x: - 0.5, y: 3.5 }, { x: - 0.5, y: - 3.5 } ],
			[ { x: 0.5, y: - 3.5 }, { x: 0.5, y: 3.5 } ],
			[ { x: 1.5, y: 3.5 }, { x: 1.5, y: - 3.5 } ],
			[ { x: 2.5, y: - 3.5 }, { x: 2.5, y: 3.5 } ],
			[ { x: 3.5, y: 3.5 }, { x: 3.5, y: - 3.5 } ],
			[ { x: 4.5, y: - 3.5 }, { x: 4.5, y: 3.5 } ],
			[ { x: 5.5, y: 3.5 }, { x: 5.5, y: - 3.5 } ]
		],
		food: [
			{ x: - 5.5, y: 3.5 },
			{ x: - 5.5, y: - 3.5 },
			{ x: 5.5, y: 3.5 },
			{ x: 5.5, y: - 3.5 }
		]
	},

	// Level 8
	{
		origin: { x: - 1, y: 0 },
		spawn: 0,
		score: 1,
		speed: 4,
		won: 3,
		floormap: [
			"██████████████",
			"█    ██    ███",
			"█ ░█    ██ ███",
			"█ ██ ██ ██ ███",
			"█    ██    ███",
			"█ ██ ██ ██ ░░█",
			"█ ██ ██ ██ ░░█",
			"█    ██    ███",
			"█ ██ ██ ██ ███",
			"█ ██    ██ ███",
			"█    ██    ███",
			"██████████████"
		],
		patrols: [
			...[ { x: - 3, y: 3 }, { x: - 3, y: 0 }, { x: - 3, y: - 3 } ].map( offset => [
				{ x: offset.x - 1.5, y: offset.y + 1.5 },
				{ x: offset.x + 1.5, y: offset.y + 1.5 },
				{ x: offset.x + 1.5, y: offset.y - 1.5 },
				{ x: offset.x - 1.5, y: offset.y - 1.5 } ] ),
			...[ { x: 3, y: 3 }, { x: 3, y: 0 }, { x: 3, y: - 3 } ].map( offset => [
				{ x: offset.x + 1.5, y: offset.y + 1.5 },
				{ x: offset.x - 1.5, y: offset.y + 1.5 },
				{ x: offset.x - 1.5, y: offset.y - 1.5 },
				{ x: offset.x + 1.5, y: offset.y - 1.5 } ] ),
			[ { x: - 1.5, y: 3.5 }, { x: 1.5, y: 3.5 }, { x: 1.5, y: - 3.5 }, { x: - 1.5, y: - 3.5 } ]
		],
		food: [
			{ x: - 4.5, y: - 4.5 },
			{ x: 4.5, y: 4.5 },
			{ x: 4.5, y: - 4.5 }
		]
	},

	// Level 9
	{
		origin: { x: 0, y: 0 },
		spawn: 0,
		score: 1,
		speed: 5,
		won: 1,
		floormap: [
			"████████████████████",
			"█░░██      ██      █",
			"█░░██      ██      █",
			"█      ██  ██  ██  █",
			"█      ██  ██  ██  █",
			"█  ██████  ██  ██░░█",
			"█  ██████  ██  ██░░█",
			"█  ██    ░░    █████",
			"█  ██    ░░    █████",
			"█      ██████      █",
			"█      ██████      █",
			"████████████████████"
		],
		patrols: [
			[ { x: - 6, y: 2.5 } ],
			[ { x: - 4.5, y: 4 } ],
			[ { x: - 2, y: 3.5 } ],
			[ { x: - 0.5, y: 2 } ],
			[ { x: - 7.5, y: 0 } ],
			[ { x: - 8.5, y: - 2 } ],
			[ { x: - 6, y: - 3.5 } ],
			[ { x: - 4.5, y: - 2 } ],
			[ { x: - 3, y: - 1.5 } ],
			[ { x: 3.5, y: 0 } ],
			[ { x: 4.5, y: 2 } ],
			[ { x: 6, y: 3.5 } ],
			[ { x: 7.5, y: 2 } ],
			[ { x: 3.5, y: - 4 } ],
			...[
				{ x: 0, y: 4 }, { x: 4, y: 4 }, { x: 8, y: 4 },
				{ x: - 8, y: 2 }, { x: - 4, y: 2 },
				{ x: 4, y: - 2 },
				{ x: - 8, y: - 4 }, { x: - 4, y: - 4 }
			].map( offset => [
				{ x: offset.x - 0.5, y: offset.y + 0.5 },
				{ x: offset.x + 0.5, y: offset.y + 0.5 },
				{ x: offset.x + 0.5, y: offset.y - 0.5 },
				{ x: offset.x - 0.5, y: offset.y - 0.5 } ] ),
			[ { x: - 0.5, y: - 0.5 }, { x: 0.5, y: - 0.5 }, { x: 0.5, y: 2 }, { x: 0.5, y: - 0.5 } ],
			[ { x: 4.5, y: - 3.5 }, { x: 7, y: - 3.5 }, { x: 7, y: - 4.5 }, { x: 7, y: - 3.5 } ]
		],
		food: [ { x: 8, y: - 4 } ]
	},

	// Level 10
	{
		origin: { x: 0, y: - 0.5 },
		spawn: 0,
		score: 1,
		speed: 1.5,
		floormap: [
			"███████████",
			"███░░░█░░░█",
			"███░░░█░░░█",
			"███ ███ ███",
			"███  █  ███",
			"███  █  ███",
			"███  █  ███",
			"█    █    █",
			"█  █████  █",
			"█         █",
			"███     ███",
			"███████████"
		],
		patrols: [
			{ x: - 2, y: 2, dX: 1 },
			{ x: - 1, y: 1, dX: - 1 },
			{ x: - 2, y: - 0, dX: 1 },
			{ x: - 1, y: - 1, dX: - 1 },
			{ x: - 3, y: - 1, dX: - 1 },
			{ x: - 4, y: - 2, dX: 1 },
			{ x: - 3, y: - 3, dX: - 1 },
			{ x: - 2, y: - 4, dY: 1 },
			{ x: - 1, y: - 3, dY: - 1 },
			{ x: 0, y: - 4, dY: 1 },
			{ x: 1, y: - 3, dY: - 1 },
			{ x: 2, y: - 4, dY: 1 },
			{ x: 3, y: - 3, dX: 1 },
			{ x: 4, y: - 2, dX: - 1 },
			{ x: 3, y: - 1, dX: 1 },
			{ x: 1, y: - 1, dX: 1 },
			{ x: 2, y: 0, dX: - 1 },
			{ x: 1, y: 1, dX: 1 },
			{ x: 2, y: 2, dX: - 1 }
		].map( p => [
			{ x: p.x, y: p.y },
			{ x: p.x + ( p.dX || 0 ), y: p.y + ( p.dY || 0 ) } ] )
	},

	// Level 11
	{
		spawn: 0,
		score: 1,
		speed: 1.5,
		won: 2,
		floormap: [
			"██████████████████",
			"█████            █",
			"█████        ██  █",
			"█████        ██░░█",
			"█████        ██░░█",
			"█░░██        █████",
			"█░░██        █████",
			"█  ██        █████",
			"█            █████",
			"██████████████████"
		],
		food: [
			{ x: - 3.5, y: 3.5 },
			{ x: 3.5, y: - 3.5 }
		],
		circles: [
			...( () => {

				const circles = [];
				for ( let v = 0.75; v < 5; v += 0.667 )
					circles.push(
						{ x: 0, y: 0, duration: - 4, offset: angleBetweenPoints( { x: 0, y: 0 }, { x: - 0.25, y: v } ) / Math.PI / 2 * 4, radius: distanceBetweenPoints( { x: 0, y: 0 }, { x: - 0.25, y: v } ) },
						{ x: 0, y: 0, duration: - 4, offset: angleBetweenPoints( { x: 0, y: 0 }, { x: 0.25, y: v } ) / Math.PI / 2 * 4, radius: distanceBetweenPoints( { x: 0, y: 0 }, { x: 0.25, y: v } ) },
						{ x: 0, y: 0, duration: - 4, offset: angleBetweenPoints( { x: 0, y: 0 }, { x: v, y: - 0.25 } ) / Math.PI / 2 * 4, radius: distanceBetweenPoints( { x: 0, y: 0 }, { x: v, y: - 0.25 } ) },
				 		{ x: 0, y: 0, duration: - 4, offset: angleBetweenPoints( { x: 0, y: 0 }, { x: v, y: 0.25 } ) / Math.PI / 2 * 4, radius: distanceBetweenPoints( { x: 0, y: 0 }, { x: v, y: 0.25 } ) },
						{ x: 0, y: 0, duration: - 4, offset: angleBetweenPoints( { x: 0, y: 0 }, { x: - 0.25, y: - v } ) / Math.PI / 2 * 4, radius: distanceBetweenPoints( { x: 0, y: 0 }, { x: - 0.25, y: - v } ) },
						{ x: 0, y: 0, duration: - 4, offset: angleBetweenPoints( { x: 0, y: 0 }, { x: 0.25, y: - v } ) / Math.PI / 2 * 4, radius: distanceBetweenPoints( { x: 0, y: 0 }, { x: 0.25, y: - v } ) },
						{ x: 0, y: 0, duration: - 4, offset: angleBetweenPoints( { x: 0, y: 0 }, { x: - v, y: - 0.25 } ) / Math.PI / 2 * 4, radius: distanceBetweenPoints( { x: 0, y: 0 }, { x: - v, y: - 0.25 } ) },
						{ x: 0, y: 0, duration: - 4, offset: angleBetweenPoints( { x: 0, y: 0 }, { x: - v, y: 0.25 } ) / Math.PI / 2 * 4, radius: distanceBetweenPoints( { x: 0, y: 0 }, { x: - v, y: 0.25 } ) } );

				return circles;

			} )()
		],
		tick: function ( time ) {

			const mode = Math.floor( time / 1000 ) % 2 ? "move" : "hold";
			if ( this.mode === mode ) return;
			this.mode = mode;

			if ( ! this.enemies ) {

				this.enemies = app.units.filter( u => u instanceof app.Enemy && u.circle );
				for ( let i = 0; i < this.enemies.length; i ++ )
					this.enemies[ i ]._circle = this.enemies[ i ].circle;

			}

			if ( mode === "move" )
				for ( let i = 0; i < this.enemies.length; i ++ )
					this.enemies[ i ].circle = this.enemies[ i ]._circle;
			 else
			 	for ( let i = 0; i < this.enemies.length; i ++ )
					delete this.enemies[ i ].circle;

		},
		clean: function () {

			delete this.enemies;
			delete this.mode;

		}

	},

	// Level 12
	{
		origin: { x: 0.25, y: 0.25 },
		spawn: 2,
		score: 1,
		speed: 3,
		won: 1,
		floormap: [
			"████████████████████",
			"█                  █",
			"█ ░░               █",
			"█ ░░               █",
			"█                  █",
			"█                  █",
			"█ ░░            ░░ █",
			"█ ░░            ░░ █",
			"█                  █",
			"████████████████████"
		],
		stills: [].concat( ...[
			"••••••••••••••••••••••••••••••••••",
			"•            ••     ••••••••••••••",
			"•                   ••••••••••••••",
			"•    ••••••      •  ••••••••••••••",
			"•    •••••••••••••  ••••••••••••••",
			"•          •••••••  ••••••••••••••",
			"•              •••  ••••••••••••••",
			"•••••••••      •••  ••••••••••••••",
			"••••••••••••••••••  ••••••••••••••",
			"•        •••••••      •••••••    •",
			"•          ••            ••      •",
			"•    •            ••             •",
			"•    •••       ••••••••          •",
			"••••••••••••••••••••••••••••••••••"
		].map( ( row, y ) => row.split( "" ).map( ( symbol, x ) =>
			symbol === "•" ? { x: x / 2 - 8.5, y: - y / 2 + 3 } : null ).filter( still => still ) ) ),
		patrols: [
			[ { x: - 5, y: - 3.5 }, { x: - 5, y: 3 } ],
			[ { x: - 4.5, y: - 3.5 }, { x: - 4.5, y: 3 } ],
			[ { x: 0.5, y: - 3.5 }, { x: 0.5, y: 3 } ],
			[ { x: 1, y: - 3.5 }, { x: 1, y: 3 } ],
			[ { x: - 2, y: 3 }, { x: - 2, y: - 3.5 } ],
			[ { x: - 1.5, y: 3 }, { x: - 1.5, y: - 3.5 } ],
			[ { x: 4, y: 3 }, { x: 4, y: - 3.5 } ],
			[ { x: 4.5, y: 3 }, { x: 4.5, y: - 3.5 } ]
		],
		food: [ { x: - 1.75, y: - 0.25 } ]
	},

	// Level 13
	{
		spawn: 1,
		score: 0,
		speed: 5,
		floormap: [
			"████████████",
			"█████░░█████",
			"█████░░█████",
			"█          █",
			"█          █",
			"█          █",
			"█          █",
			"█          █",
			"█          █",
			"█████░░█████",
			"█████░░█████",
			"████████████"
		],
		patrols: [
			...Array( 5 ).fill( 0 ).map( ( v, i ) => ( [ { x: i * 2 - 4.5, y: 2.5 }, { x: i * 2 - 4.5, y: - 2.5 } ] ) ),
			...Array( 5 ).fill( 0 ).map( ( v, i ) => ( [ { x: i * 2 - 3.5, y: - 2.5 }, { x: i * 2 - 3.5, y: 2.5 } ] ) ),
			[ { x: - 4.5, y: 0.5 }, { x: 4.5, y: 0.5 } ],
			[ { x: 4.5, y: - 0.5 }, { x: - 4.5, y: - 0.5 } ]
		]
	},

	// Level 14
	{
		spawn: 1,
		score: 0,
		speed: 2,
		floormap: [
			"████████████████████",
			"████████████████░░░█",
			"████████████████░░░█",
			"████████████████░░░█",
			"█░░░               █",
			"█░░░               █",
			"█░░░               █",
			"████████████████████"
		],
		patrols: [
			...[ - 4.5, - 0.5, 3.5, 7.5 ].map( x => [ { x, y: - 1.5 } ] ),
			[ { x: - 2.5, y: - 0.25 }, { x: - 2.5, y: - 2.25 } ],
			[ { x: - 2.5, y: - 0.75 }, { x: - 2.5, y: - 2.75 } ],
			[ { x: 5.5, y: - 0.25 }, { x: 5.5, y: - 2.25 } ],
			[ { x: 5.5, y: - 0.75 }, { x: 5.5, y: - 2.75 } ],
			[ { x: 1.5, y: - 2.25 }, { x: 1.5, y: - 0.25 } ],
			[ { x: 1.5, y: - 2.75 }, { x: 1.5, y: - 0.75 } ]
		],
		circles: [].concat( ...[ - 4.5, - 0.5, 3.5, 7.5 ].map( x => [].concat( ...[ 0, 0.25, 0.5, 0.75 ].map( arm => [ 0.72, 1.44 ].map( radius => ( {
			x, y: - 1.5, radius, duration: - 3, offset: 3 * arm
		} ) ) ) ) ) )
	},

	// Level 15
	{
		origin: { x: - 0.5, y: 0.5 },
		spawn: 0,
		score: 1,
		speed: 6,
		floormap: [
			"██████████████████████",
			"█░░░█       █        █",
			"█░░░█       █        █",
			"█ ███       █        █",
			"█   █   █   █   ██   █",
			"█   █   █   █   ██   █",
			"█   █   █   █   ██   █",
			"█   █   █   █   ██   █",
			"█       █       ████ █",
			"█       █       ██░░░█",
			"█       █       ██░░░█",
			"██████████████████████"
		],
		patrols: [
			{ x: - 9, y: 1, dY: - 6 },
			{ x: - 8, y: - 5, dY: 6 },
			{ x: - 7, y: 1, dY: - 6 },
			{ x: - 6, y: - 3, dY: - 2 },
			{ x: - 5, y: 4, dY: - 9 },
			{ x: - 4, y: - 5, dY: 9 },
			{ x: - 3, y: 4, dY: - 9 },
			{ x: - 2, y: 4, dY: - 2 },
			{ x: - 1, y: 4, dY: - 9 },
			{ x: 0, y: - 5, dY: 9 },
			{ x: 1, y: 4, dY: - 9 },
			{ x: 2, y: - 3, dY: - 2 },
			{ x: 3, y: 4, dY: - 9 },
			{ x: 4, y: - 5, dY: 9 },
			{ x: 5, y: 4, dY: - 9 },
			{ x: 6, y: 4, dY: - 2 },
			{ x: 7, y: 2, dY: 2 },
			{ x: 8, y: - 2, dY: 6 },
			{ x: 9, y: 4, dY: - 6 },
			{ x: 10, y: - 2, dY: 6 }
		].map( p => [
			{ x: p.x, y: p.y },
			{ x: p.x + ( p.dX || 0 ), y: p.y + ( p.dY || 0 ) } ] )
	}

];

for ( let i = 0; i < levels.length; i ++ ) {

	levels[ i ].height = levels[ i ].floormap.length;
	levels[ i ].width = levels[ i ].floormap.reduce( ( width, row ) => Math.max( width, row.length ), - Infinity );

}

/////////////////////////////////////////////////
///// Misc
/////////////////////////////////////////////////

function tileToWorld( x, y ) {

	return {
		x: x - Math.floor( levels[ app.state.levelIndex ].width / 2 ) + ( levels[ app.state.levelIndex ].width % 2 === 0 ? 0.5 : 0 ),
		y: - y + Math.floor( levels[ app.state.levelIndex ].height / 2 ) - ( levels[ app.state.levelIndex ].height % 2 === 0 ? 0.5 : 0 )
	};

}

function worldToTile( x, y ) {

	return {
		x: x + Math.floor( levels[ app.state.levelIndex ].width / 2 ) - ( levels[ app.state.levelIndex ].width % 2 === 0 ? 0.5 : 0 ),
		y: - ( y - Math.floor( levels[ app.state.levelIndex ].height / 2 ) + ( levels[ app.state.levelIndex ].height % 2 === 0 ? 0.5 : 0 ) )
	};

}

function roundTo( value, decimals = 0 ) {

	decimals = Math.pow( 10, decimals );

	return Math.round( value * decimals ) / decimals;

}

function canPlace( character, xDelta = 0, yDelta = 0 ) {

	const corners = [
		worldToTile( roundTo( character.x + xDelta + SIZE / 2, 4 ), roundTo( character.y + yDelta + SIZE / 2, 4 ) ),
		worldToTile( roundTo( character.x + xDelta + SIZE / 2, 4 ), roundTo( character.y + yDelta - SIZE / 2, 4 ) ),
		worldToTile( roundTo( character.x + xDelta - SIZE / 2, 4 ), roundTo( character.y + yDelta + SIZE / 2, 4 ) ),
		worldToTile( roundTo( character.x + xDelta - SIZE / 2, 4 ), roundTo( character.y + yDelta - SIZE / 2, 4 ) )
	];

	return ! corners.some( corner => levels[ app.state.levelIndex ].floormap[ Math.round( corner.y ) ][ Math.round( corner.x ) ] === "█" );

}

function offset( point ) {

	const level = levels[ app.state.levelIndex ];

	return { x: point.x + ( level.origin ? level.origin.x || 0 : 0 ), y: point.y + ( level.origin ? level.origin.y || 0 : 0 ) };

}

function angleBetweenPoints( p1, p2 ) {

	return Math.atan2( p2.y - p1.y, p2.x - p1.x );

}

function distanceBetweenPoints( p1, p2 ) {

	return ( ( p2.x - p1.x ) ** 2 + ( p2.y - p1.y ) ** 2 ) ** ( 1 / 2 );

}

function calculateCheckpoints() {

	const level = levels[ app.state.levelIndex ];
	const grid = Array( level.floormap.length ).fill( 0 ).map( () => [] );

	level.checkpoints = [];

	for ( let y = 0; y < level.floormap.length; y ++ )
		for ( let x = 0; x < level.floormap[ y ].length; x ++ ) {

			const tile = level.floormap[ y ][ x ];

			if ( tile !== "░" || grid[ y ][ x ] ) continue;

			const topLeft = tileToWorld( x, y );
			topLeft.x -= 0.5;
			topLeft.y += 0.5;

			let tX = x;
			let tY = y;

			while ( level.floormap[ y ][ tX + 1 ] === "░" ) tX ++;
			while ( level.floormap[ tY + 1 ][ tX ] === "░" ) tY ++;

			const bottomRight = tileToWorld( tX, tY );
			bottomRight.x += 0.5;
			bottomRight.y -= 0.5;

			level.checkpoints.push( new app.Rect( topLeft, bottomRight ) );

			for ( let ttY = y; ttY <= tY; ttY ++ )
				for ( let ttX = x; ttX <= tX; ttX ++ )
					grid[ ttY ][ ttX ] = true;

		}

}
