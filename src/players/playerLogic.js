
import network from "../network.js";
import game from "../index.js";
import Player from "./Player.js";
import {
	next as nextColor,
	take as takeColor,
	release as releaseColor,
} from "./colors.js";
import { updateDisplay } from "./elo.js";
import Random from "../lib/alea.js";
import "./chat.js";
import "./login.js";

// Received when someone (including us) joins
network.addEventListener( "connection", data => {

	game.update( data );

	game.random = new Random( data.time.toString() );

	const player = new Player( {
		color: nextColor(),
		id: data.connection,
		username: data.username,
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

	game.players.splice( playerIndex, 1 );

	releaseColor( player.color );
	player.isHere = false;

	updateDisplay();

} );

// Received by the a random player upon someone connecting
network.addEventListener( "state", ( { time, arena, players: inputPlayers } ) => {

	game.update( { time } );

	inputPlayers.forEach( ( { color, id, ...playerData } ) => {

		const player = game.players.find( p => p.id === id ) || new Player( { ...playerData, id } );

		if ( ! player.color || player.color.index !== color ) {

			if ( player.color ) releaseColor( player.color );
			player.color = takeColor( color );

		}

		player.score = playerData.score;

	} );
	game.players.sort( ( a, b ) => a.id - b.id );

	game.setArena( arena );
	game.receivedState = "state";
	game.lastRoundEnd = time / 1000;
	// game.random = new Random( time );

	updateDisplay();

} );
