
/////////////////////////////////////////////////
///// Overhead
////////////////////////////////////////////////

{

	const isBrowser = new Function( "try {return this===window;}catch(e){ return false;}" )();

	//For Node (i.e., servers)
	if ( ! isBrowser ) {

		THREE = require( "three" );
		WebCraft = require( "../../../build/webcraft.js" );
		Multiboard = require( "../../shared/ui/Multiboard.js" );

	}

}

/////////////////////////////////////////////////
///// Initialization
////////////////////////////////////////////////

const keyboard = {};

const SIZE = 0.6;

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
			{ name: "Food", model: { path: "../../models/Sphere.js", color: "#FFFF00", scale: 0.5 } },
			{ name: "Enemy", model: { path: "../../models/Sphere.js", color: "#0000FF", scale: 0.5 }, speed: 7 }
		]
	},

	intentSystem: {

		keydown: e => {

			if ( keyboard[ e.key ] ) return;
			keyboard[ e.key ] = true;

			if ( [ "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight" ].indexOf( e.key ) === - 1 ) return;

			app.network.send( { type: "keydown", direction: e.key } );

		},

		keyup: e => {

			if ( ! keyboard[ e.key ] ) return;
			keyboard[ e.key ] = false;

			if ( [ "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight" ].indexOf( e.key ) === - 1 ) return;

			app.network.send( { type: "keyup", direction: e.key } );

		}

	}

} );

app.state = { players: app.players, units: app.units, doodads: app.doodads, levelIndex: 0 };

const multiboard = new Multiboard( { columns: 2, schema: [ "color.name", "points" ], colors: app.Player.colors.map( color => color.hex ) } );

/////////////////////////////////////////////////
///// Game Logic
/////////////////////////////////////////////////

function spawn( player ) {

	const char = new app.Character( { owner: player, x: levels[ app.state.levelIndex ].spawn.x, y: levels[ app.state.levelIndex ].spawn.y, z: 1 } );
	player.character = char;
	char.onNear( app.units, SIZE, onNear );
	char.addEventListener( "death", onDeath );

}

function cleanup() {

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

	for ( let i = 0; i < app.players.length; i ++ )
		spawn( app.players[ i ] );

	for ( let y = 0; y < level.floormap.length; y ++ )
		for ( let x = 0; x < level.floormap[ y ].length; x ++ ) {

			const tile = level.floormap[ y ][ x ];

			const klass = tile === "░" ? app.Green :
				tile === " " ? ( ( x + y ) % 2 === 0 ? app.TileWhite : app.TileGray ) : undefined;

			if ( ! klass ) continue;

			new klass( tileToWorld( x, y ) );

		}

	if ( level.patrols )
		for ( let i = 0; i < level.patrols.length; i ++ ) {

			const unit = new app.Enemy( Object.assign( { z: 1 }, level.patrols[ i ][ 0 ] ) );
			unit.patrol( level.patrols[ i ] );

		}

	if ( level.food )
		for ( let i = 0; i < level.food.length; i ++ )
			Object.assign( new app.Food( Object.assign( { z: 1 }, level.food[ i ] ) ), { food: i } );

	if ( WebCraft.isBrowser ) app.camera.position.z = Math.max( level.width / 2 + 10, level.height );

	app.updates.push( tick );

}

function onDeath() {

	const player = this.owner;

	for ( let i = 0; i < player.food.length; i ++ )
		if ( player.food[ i ] )
			Object.assign( new app.Food( Object.assign( { z: 1 }, levels[ app.state.levelIndex ].food[ i ] ) ), { food: i } );

	player.food = [];

	this.remove();

	spawn( player );

}

function onNear( e ) {

	const character = e.target;
	const player = character.owner;

	for ( let i = 0; i < e.objects.length; i ++ )
		if ( e.objects[ i ] instanceof app.Enemy ) character.kill();
		else if ( e.objects[ i ] instanceof app.Food ) {

			player.food[ e.objects[ i ].food ] = true;
			e.objects[ i ].remove();

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

			if ( ! xDelta && ! yDelta ) continue;

			if ( xDelta !== 0 && canPlace( player.character, xDelta, 0 ) ) player.character.x = roundTo( player.character.x + xDelta, 4 );
			if ( yDelta !== 0 && canPlace( player.character, 0, yDelta ) ) player.character.y = roundTo( player.character.y + yDelta, 4 );

			if ( level.won( player ) ) point( player );

		}

}

function point( player ) {

	app.updates.splice( app.updates.indexOf( tick ), 1 );

	++ player.points;
	multiboard.update( app.players );

	start();

}

/////////////////////////////////////////////////
///// Server Events
/////////////////////////////////////////////////

function newPlayer( player ) {

	player.food = [];
	player.state = [ "character", "points" ];
	if ( ! player.points ) player.points = 0;

	if ( app.players.length === 1 ) start();
	else {

		if ( player.character === undefined ) spawn( player );
		if ( player === app.localPlayer ) app.updates.push( tick );

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

} );

/////////////////////////////////////////////////
///// Player Actions
/////////////////////////////////////////////////

app.addEventListener( "keydown", ( { direction, player } ) => player[ direction ] = true );
app.addEventListener( "keyup", ( { direction, player } ) => player[ direction ] = false );

/////////////////////////////////////////////////
///// Levels
/////////////////////////////////////////////////

const levels = [

	// Level 1
	{
		spawn: { x: - 7.5, y: 0 },
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
		],
		won: player => player.character.x > 6
	},

	// Level 2
	{
		spawn: { x: - 7.5, y: 0 },
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
		food: [
			{ x: 0, y: 0 }
		],
		won: player => player.character.x > 6 && player.food.filter( food => food ).length >= 1
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
