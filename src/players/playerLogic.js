
import network from "../network.js";
import game from "../index.js";
import Player from "./Player.js";
import {
	colors,
	next as nextColor,
	take as takeColor,
	release as releaseColor,
} from "./colors.js";
import { updateDisplay } from "./elo.js";

const newPlayer = data => {

	const player = new Player( data );
	game.players.push( player );
	return player;

};

// Received when someone (including us) joins
network.addEventListener( "connection", data => {

	const player = new Player( { id: data.connection, color: nextColor() } );

	if ( game.localPlayer === undefined ) game.localPlayer = player;

	game.players.push( player );

	if ( game.isHost ) {

		if ( game.host === undefined ) game.host = player;

		network.send( {
			type: "state",
			arena: game.settings.arenaIndex,
			players: game.players.map( p => ( {
				id: p.id, color:
				colors.indexOf( p.color ),
				score: p.score,
			} ) ),
		} );

	}

	updateDisplay();

} );

// Received when someone leaves
network.addEventListener( "disconnection", ( { connection } ) => {

	const playerIndex = game.players.findIndex( p => p.id === connection );
	if ( playerIndex === - 1 ) return;
	const player = game.players[ playerIndex	];

	game.players.splice( playerIndex, 1 );

	if ( ! game.host || game.host.id === connection ) {

		game.host = game.players[ 0 ];
		if ( game.host === game.localPlayer )
			game.isHost = true;

	}

	releaseColor( player.color );

	updateDisplay();

} );

// Received by the host upon someone connecting
network.addEventListener( "state", ( { arena, players: inputPlayers } ) => {

	inputPlayers.forEach( ( { color, id, ...playerData } ) => {

		const player = game.players.find( p => p.id === id ) || newPlayer( { ...playerData, id } );

		if ( ! player.color || player.color.index !== color ) {

			if ( player.color ) releaseColor( player.color );
			player.color = takeColor( color );

		}

		player.score = playerData.score;

	} );
	game.players.sort( ( a, b ) => a.id - b.id );

	if ( ! game.host ) game.host = game.players.find( p => p.id === inputPlayers[ 0 ].id );

	game.setArena( arena );

	updateDisplay();

} );
