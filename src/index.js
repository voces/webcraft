
import network from "./network.js";

import Game from "./Game.js";
// import Random from "./lib/alea.js";
import { document, location, window } from "./util/globals.js";
import { patchInState } from "./players/Player.js";
// import Player from "./players/Player.js";
// import {
// 	take as takeColor,
// 	release as releaseColor,
// } from "./players/colors.js";
// import { updateDisplay } from "./players/elo.js";
import "./players/playerLogic.js";
import "./sprites/spriteLogic.js";
import "./players/camera.js";
import "./ui/clock.js";
import "./ui/waitingSplash.js";
import "./ui/hotkeys.js";

// eslint-disable-next-line no-undef
const game = globalThis.game = new Game();

const arena = document.getElementById( "arena" );
arena.x = 0;
arena.y = 0;

// We receive this upon connecting; the only state we get is the number of connections
network.addEventListener( "init", ( { connections, state: { players: inputPlayers } } ) => {

	if ( connections === 0 )
		game.receivedState = "init";

	patchInState( inputPlayers );

} );
// network.addEventListener( "init", ( { time, state: { arena, players: inputPlayers, lastRoundEnd } } ) => {

// 	game.update( { time } );

// 	inputPlayers.forEach( ( { color, id, ...playerData } ) => {

// 		const player = game.players.find( p => p.id === id ) || new Player( { ...playerData, id } );

// 		if ( ! player.color || player.color.index !== color ) {

// 			if ( player.color ) releaseColor( player.color );
// 			player.color = takeColor( color );

// 		}

// 		player.score = playerData.score;

// 	} );
// 	game.players.sort( ( a, b ) => a.id - b.id );

// 	game.setArena( arena );
// 	game.receivedState = "state";
// 	game.lastRoundEnd = lastRoundEnd;
// 	game.random = new Random( time );

// 	updateDisplay();

// } );

network.addEventListener( "update", e => {

	game.update( e );

} );

window.addEventListener( "contextmenu", e => {

	e.preventDefault();

} );

const host = location.port ? `${location.hostname}:${8080}` : `ws.${location.hostname}`;
let remainingErrors = 3;
window.addEventListener( "error", event => {

	if ( remainingErrors === 0 ) return;
	remainingErrors --;

	fetch( `http://${host}/error`, {
		method: "POST",
		body: JSON.stringify( { stack: event.error.stack } ),
		headers: { "Content-Type": "application/json" },
	} );

} );
setInterval( () => remainingErrors = Math.min( 3, remainingErrors + 1 ), 5000 );

export default game;
