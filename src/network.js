
import emitter from "./emitter.js";
import game from "./index.js";
import newPingMessage from "./ui/ping.js";

let connection;

const network = emitter( {
	send: data => connection.send( JSON.stringify( Object.assign( data, { sent: Date.now() } ) ) ),
	connect: ( username = "" ) => {

		const host = location.port ? `${location.hostname}:${8080}` : `ws.${location.hostname}`;
		connection = new WebSocket( `ws://${host}?${username}` );

		connection.addEventListener( "message", message => {

			const json = JSON.parse( message.data );

			if ( game.localPlayer && game.localPlayer.id === json.connection )
				newPingMessage( { type: json.type, ping: Date.now() - json.sent } );

			if ( typeof json.type === "string" && json.type.length )
				network.dispatchEvent( json.type, json );

		} );

	},
} );

export default network;
