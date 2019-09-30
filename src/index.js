
import network from "./network.js";

import Game from "./Game.js";
import "./players/playerLogic.js";
import "./sprites/spriteLogic.js";
import "./players/camera.js";

const game = window.game = new Game();

const arena = document.getElementById( "arena" );
arena.x = 0;
arena.y = 0;

// We receive this upon connecting; the only state we get is the number of connections
network.addEventListener( "init", ( { connections } ) => {

	game.isHost = connections === 1;

} );

// Received upon the host starting the round
network.addEventListener( "start", ( { seed, time } ) => {

	game.start( { seed, time } );

} );

network.addEventListener( "update", e => {

	game.update( e );

} );

window.addEventListener( "keydown", e => {

	if ( ! game.isHost || game.round ) return;

	if ( e.key === "ArrowDown" )
		network.send( { type: "start", seed: Math.random() } );

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
