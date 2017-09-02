
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
			{ name: "Food", model: { path: "../../models/Sphere.js", color: "#FFFF00" } },
			{ name: "Enemy", model: { path: "../../models/Sphere.js", color: "#0000FF", scale: 0.7 }, speed: 7.5 }
		]
	},

	intentSystem: {

		keydown: e => {

			if ( keyboard[ e.key ] ) return;
			keyboard[ e.key ] = true;

			if ( [ "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight" ].indexOf( e.key ) === - 1 ) return;

			app.network.send( { type: "keydown", "direction": e.key } );

		},

		keyup: e => {

			if ( ! keyboard[ e.key ] ) return;
			keyboard[ e.key ] = false;

			if ( [ "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight" ].indexOf( e.key ) === - 1 ) return;

			app.network.send( { type: "keyup", "direction": e.key } );

		}

	}

} );

app.state = { players: app.players, units: app.units, levelIndex: 0 };

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

/////////////////////////////////////////////////
///// Game Logic
/////////////////////////////////////////////////

function start() {

	const level = levels[ app.state.levelIndex ];

	for ( let i = 0; i < app.players.length; i ++ ) {

		const char = new app.Character( { owner: app.players[ i ], x: level.spawn.x, y: level.spawn.y, z: 1 } );
		app.players[ i ].character = char;

		char.addEventListener( "nearsAnotherUnit", console.log );

	}

	for ( let y = 0; y < level.floormap.length; y ++ )
		for ( let x = 0; x < level.floormap[ y ].length; x ++ ) {

			const tile = level.floormap[ y ][ x ];

			const klass = tile === "░" ? app.Green :
				tile === " " ? ( ( x + y ) % 2 === 0 ? app.TileWhite : app.TileGray ) : undefined;

			if ( ! klass ) continue;

			new klass( tileToWorld( x, y ) );

		}

	for ( let i = 0; i < level.patrols.length; i ++ ) {

		const unit = new app.Enemy( Object.assign( { z: 1 }, level.patrols[ i ][ 0 ] ) );
		unit.patrol( level.patrols[ i ] );

	}

	app.camera.position.z = Math.max( level.width / 2 + 10, level.height );

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

let lastTime;
app.updates.push( time => {

	const delta = ( time - lastTime ) / 1000;
	lastTime = time;

	for ( let i = 0; i < app.players.length; i ++ )
		if ( app.players[ i ].character ) {

			const player = app.players[ i ];

			const xDelta = ( ( player.ArrowRight ? 1 : 0 ) - ( player.ArrowLeft ? 1 : 0 ) ) * player.character.speed * delta;
			const yDelta = ( ( player.ArrowUp ? 1 : 0 ) - ( player.ArrowDown ? 1 : 0 ) ) * player.character.speed * delta;

			if ( ! xDelta && ! yDelta ) return;

			if ( xDelta !== 0 && canPlace( player.character, xDelta, 0 ) ) player.character.x = roundTo( player.character.x + xDelta, 4 );
			if ( yDelta !== 0 && canPlace( player.character, 0, yDelta ) ) player.character.y = roundTo( player.character.y + yDelta, 4 );

		}

} );

/////////////////////////////////////////////////
///// Game Events
/////////////////////////////////////////////////

app.addEventListener( "playerJoin", ( { player } ) => {

} );

app.addEventListener( "state", ( { state } ) => {

	start();

} );

app.addEventListener( "playerLeave", ( { player } ) => {

	player.remove();

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
		won: unit => unit.y > 6
	}

];

for ( let i = 0; i < levels.length; i ++ )
	Object.defineProperties( levels[ i ], {
		height: { get: () => levels[ i ]._height || ( levels[ i ]._height = levels[ i ].floormap.length ) },
		width: { get: () => levels[ i ]._width || ( levels[ i ]._width = levels[ i ].floormap.reduce( ( width, row ) => Math.max( width, row.length ), - Infinity ) ) }
	} );
