
import emitter from "./emitter.js";

const host = location.port ? `${location.hostname}:${8080}` : `ws.${location.hostname}`;
const connection = new WebSocket( `ws://${host}` );

connection.addEventListener( "message", message => {

	const json = JSON.parse( message.data );

	if ( typeof json.type === "string" && json.type.length )
		network.dispatchEvent( json.type, json );

} );

const network = emitter( {
	send: data => connection.send( JSON.stringify( data ) ),
} );

export default network;
