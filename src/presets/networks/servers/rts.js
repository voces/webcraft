
import { Server } from "ws";

import EventDispatcher from "../../../core/EventDispatcher";
import Handle from "../../../core/Handle";
import Collection from "../../../core/Collection.js";
import stringify from "../../../misc/stringify.js";

class ServerNetwork extends EventDispatcher {

	constructor( props = {} ) {

		super();

		this.clients = props.clients || new Collection();
		this.ws = props.ws && props.ws.constructor !== Object && props.ws || this.createWS( props );

		this.charsSent = 0;

		setInterval( () => {

			if ( ! this.charsSent ) return;
			// console.log( this.charsSent );
			this.charsSent = 0;

		}, 1000 );

	}

	send( data, toJSON ) {

		if ( typeof data === "object" ) {

			if ( this.app ) {

				if ( data instanceof Array ) {

					for ( let i = 0; i < data.length; i ++ )
						if ( data[ i ].time === undefined ) data[ i ].time = this.app.time;

				} else if ( data.time === undefined ) data.time = this.app.time;

			}

			if ( toJSON ) data = stringify( data, this.replacer, toJSON );
			else data = JSON.stringify( data, this.replacer );

		} else if ( typeof data !== "string" ) data = data.toString();

		// if ( this.clients.length )
		// 	console.log( "SEND", data );

		for ( let i = 0; i < this.clients.length; i ++ ) {

			try {

				this.clients[ i ].send( data );

			} catch ( err ) {}

			this.charsSent += data.length;

		}

	}

	createWS( props = {} ) {

		const ws = new Server( { port: props.port || 3000 } );
		console.log( "Listening on", props.port || 3000 );

		ws.on( "connection", socket => {

			socket.id = ( Handle.id )++;
			socket.key = "c" + socket.id;
			this.clients.add( socket );
			console.log( "Connection from", socket._socket.remoteAddress, "on", socket._socket.remotePort, "as", socket.id );

			socket.onclose = () => {

				this.clients.remove( socket );

				this.app.dispatchEvent( { type: "clientLeave", client: { id: socket.id } } );

			};

			socket.onmessage = data => {

				// Ignore large messages
				if ( data.length > 1000 ) return;

				try {

					data = JSON.parse( data.data, this.reviver );

				} catch ( err ) {

					console.error( "Invalid message from client", socket.key );
					console.error( "May be a bug in the code or nefarious action" );

				}

				this.app.dispatchEvent( { type: "clientMessage", client: { id: socket.id }, message: data } );

			};

			this.app.dispatchEvent( { type: "clientJoin", client: { id: socket.id, send: ( data, toJSON ) => {

				if ( typeof data === "object" ) {

					if ( this.app ) {

						if ( data instanceof Array ) {

							for ( let i = 0; i < data.length; i ++ )
								if ( data[ i ].time === undefined ) data[ i ].time = this.app.time;

						} else if ( data.time === undefined ) data.time = this.app.time;

					}

					if ( toJSON ) data = stringify( data, this.replacer, toJSON );
					else data = JSON.stringify( data, this.replacer );

				}

				try {

					socket.send( data );

				} catch ( err ) {}

			} } } );

		} );

		return ws;

	}

}

export default ServerNetwork;
