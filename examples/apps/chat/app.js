
import App from "../../../src/App.js";

class Chat extends App {

	constructor( ...args ) {

		super( ...args );

	}

}

const ws = new WebSocket( "ws://notextures.io:8089", [ "gamez", "game2 game3" ] );

ws.onopen = console.log;

console.log( ws );

export default Chat;
