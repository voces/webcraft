
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

const app = new WebCraft.App( {

	network: { host: "notextures.io", port: 8086 },

	types: {
		doodads: [
			{ name: "Green", model: { path: "../../models/Cube.js", color: "#B5FEB4" } },
			{ name: "TileWhite", model: { path: "../../models/Cube.js", color: "#F7F7FF" } },
			{ name: "TileGray", model: { path: "../../models/Cube.js", color: "#E6E6FF" } }
		],
		units: [
			{ name: "Character", model: { path: "../../models/Cube.js", scale: 0.75 }, speed: 2.5 },
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

	for ( let i = 0; i < app.players.length; i ++ )
		app.players[ i ].character = new app.Character( { owner: app.players[ i ], x: level.spawn.x, y: level.spawn.y, z: 1 } );

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

let lastTime;
app.updates.push( time => {

	const delta = time - lastTime;
	lastTime = time;

	for ( let i = 0; i < app.players.length; i ++ )
		if ( app.players[ i ].character ) {

			const xRate = app.players[ i ].character._props.x.rate || 0;
			const yRate = app.players[ i ].character._props.y.rate || 0;

			if ( ! xRate && ! yRate ) return;

			const tile = worldToTile( app.players[ i ].character.x + Math.sign( xRate ) * 0.376, app.players[ i ].character.y + Math.sign( yRate ) * 0.376 );

			const predictX = Math.round( tile.x );
			const predictY = Math.round( tile.y );

			if ( levels[ app.state.levelIndex ].floormap[ predictY ][ predictX ] !== "█" ) return;

			if ( xRate ) app.players[ i ].character._props.x.start -= xRate * delta;
			if ( yRate ) app.players[ i ].character._props.y.start -= yRate * delta;

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

function updateMovement( player ) {

	if ( ! player.character ) return;

	const x = ( ( player.ArrowRight ? 1 : 0 ) - ( player.ArrowLeft ? 1 : 0 ) ) * player.character.speed;
	const y = ( ( player.ArrowUp ? 1 : 0 ) - ( player.ArrowDown ? 1 : 0 ) ) * player.character.speed;

	if ( x === 0 ) player.character.x = player.character.x;
	else player.character.x = app.linearTween( { start: player.character.x, rate: x, duration: Infinity } );

	if ( y === 0 ) player.character.y = player.character.y;
	else player.character.y = app.linearTween( { start: player.character.y, rate: y, duration: Infinity } );

}

app.addEventListener( "keydown", ( { direction, player } ) => ( player[ direction ] = true, updateMovement( player ) ) );
app.addEventListener( "keyup", ( { direction, player } ) => ( player[ direction ] = false, updateMovement( player ) ) );

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
