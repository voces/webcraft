
import emitter from "./emitter.js";
import game from "./index.js";
import newPingMessage from "./ui/ping.js";
import { location } from "./util/globals.js";

let connection;

export const activeHost = location.port ?
	`${location.hostname}:${8080}` :
	`ws.${location.hostname}`;

const network = emitter( {
	send: data => connection.send( JSON.stringify( Object.assign( data, { sent: performance.now() } ) ) ),
	connect: token => {

		connection = new WebSocket( `ws://${activeHost}?${encodeURIComponent( token )}` );

		connection.addEventListener( "message", message => {

			const json = JSON.parse( message.data );

			if ( game.localPlayer && game.localPlayer.id === json.connection )
				newPingMessage( { type: json.type, ping: performance.now() - json.sent } );

			if ( typeof json.type === "string" && json.type.length )
				network.dispatchEvent( json.type, json );

		} );

	},
	get isHost() {

		return ! connection;

	},
} );

export default network;

const wrappedFetch = ( url, body, options = {} ) => {

	if ( ! url.match( /^\w+:\/\// ) )
		url = `http://${activeHost}/${url.replace( /^\//, "" )}`;

	if ( ! options.headers ) options.headers = {};
	if ( ! options.headers[ "Content-Type" ] )
		options.headers[ "Content-Type" ] = "application/json";

	if ( body && typeof body !== "string" )
		options.body = JSON.stringify( body );

	if ( options.body && options.method === undefined )
		options.method = "POST";

	return fetch( url, options ).then( r => r.json() );

};

export { wrappedFetch as fetch };
