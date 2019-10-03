
import emitter from "./emitter.js";

let connection;

const network = emitter( {
	send: data => connection.send( JSON.stringify( data ) ),
	connect: ( username = "" ) => {

		const host = location.port ? `${location.hostname}:${8080}` : `ws.${location.hostname}`;
		connection = new WebSocket( `ws://${host}?${username}` );

		connection.addEventListener( "message", message => {

			const json = JSON.parse( message.data );

			if ( typeof json.type === "string" && json.type.length )
				network.dispatchEvent( json.type, json );

		} );

	},
} );

export default network;
