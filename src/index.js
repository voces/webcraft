
import network from "./network.js";

import Game from "./Game.js";
import Random from "./lib/alea.js";
import "./players/playerLogic.js";
import "./sprites/spriteLogic.js";
import "./players/camera.js";

const game = window.game = new Game();

const arena = document.getElementById( "arena" );
arena.x = 0;
arena.y = 0;

// We receive this upon connecting; the only state we get is the number of connections
network.addEventListener( "init", ( { connections } ) => {

	if ( connections === 1 ) {

		game.random = new Random( Date.now() );
		game.receivedState = "init";

	}

} );

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
