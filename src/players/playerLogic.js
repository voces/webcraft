
import network from "../network.js";
import game from "../index.js";
import Player, { patchInState } from "./Player.js";
import {
	next as nextColor,
	release as releaseColor,
} from "./colors.js";
import { updateDisplay } from "./elo.js";
import Random from "../lib/alea.js";
import "./chat.js";
import "./login.js";

// Received when someone (including us) joins
network.addEventListener( "connection", data => {

	game.random = new Random( data.time.toString() );

	game.update( data );

	const player = new Player( {
		color: nextColor(),
		id: data.connection,
		username: data.username,
		crosserPlays: Math.max( 0, ...game.players.map( p => p.crosserPlays ) ),
	} );

	if ( game.localPlayer === undefined && ! network.isHost ) game.localPlayer = player;
	else game.newPlayers = true;

	updateDisplay();

} );

// Received when someone leaves
network.addEventListener( "disconnection", ( { time, connection } ) => {

	game.update( { time } );

	const playerIndex = game.players.findIndex( p => p.id === connection );
	if ( playerIndex === - 1 ) return;
	const player = game.players[ playerIndex ];

	player.isHere = false;

	if ( game.round )
		game.round.onPlayerLeave( player );

	game.players.splice( playerIndex, 1 );

	releaseColor( player.color );

	updateDisplay();

} );

// Received by the the upon someone connecting after the round ends
network.addEventListener( "state", ( {
	time,
	state: {
		arena,
		players: inputPlayers,
	} } ) => {

	game.update( { time } );

	patchInState( inputPlayers );

	game.setArena( arena );
	game.receivedState = "state";
	game.lastRoundEnd = time / 1000;
	// game.random = new Random( time );

	updateDisplay();

} );
