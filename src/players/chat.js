
import network from "../network.js";
import game from "../index.js";

const chatLog = document.getElementById( "chat-log" );
const chatInput = document.getElementById( "chat-input" );

class Chat {

	activate() {

		chatInput.style.visibility = "visible";
		chatInput.focus();

	}

	onEnter() {

		chatInput.style.visibility = "hidden";
		network.send( { type: "chat", message: chatInput.value } );
		chatInput.value = "";

	}

}

const chat = new Chat();

window.addEventListener( "keydown", e => {

	if ( ! chat.active && e.key === "Enter" ) chat.activate();

} );

chatInput.addEventListener( "keydown", e => {

	e.stopPropagation();
	if ( e.key === "Enter" ) chat.onEnter();

} );

const maxLength = 256;
network.addEventListener( "chat", ( { connection, message } ) => {

	message = message.slice( 0, maxLength );

	const player = game.players.find( p => p.id === connection );
	if ( ! player ) return;

	const entry = document.createElement( "div" );

	const playerName = document.createElement( "span" );
	playerName.textContent = player.username;
	playerName.style.color = player.color.hex;
	entry.appendChild( playerName );

	const rest = document.createTextNode( `: ${message}` );
	entry.append( rest );

	chatLog.appendChild( entry );

	setTimeout( () => {

		entry.style.opacity = "0";
		setTimeout( () => entry.remove(), maxLength * 50 );

	}, 5000 + message.length * 50 );

} );

export default chat;

