
import network from "./network.js";

import Game from "./Game.js";
import "./players/playerLogic.js";
import "./sprites/spriteLogic.js";

const game = window.game = new Game();

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

	if ( e.key.includes( "Arrow" ) && game.round )
		return console.warn( "Have not implemented scrolling yet" );

	if ( ! game.isHost ) return;

	if ( e.key === "ArrowDown" )
		network.send( { type: "start", seed: Math.random() } );

} );

window.addEventListener( "contextmenu", e => {

	e.preventDefault();

} );

const host = location.port ? `${location.hostname}:${8080}` : `ws.${location.hostname}`;
window.addEventListener( "error", event => {

	fetch( `http://${host}/error`, {
		method: "POST",
		body: JSON.stringify( { stack: event.error.stack } ),
		headers: { "Content-Type": "application/json" },
	} );

} );

export default game;
