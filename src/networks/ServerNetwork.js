
import { Server } from "ws";

import EventDispatcher from "../core/EventDispatcher";
import Collection from "../core/Collection.js";

let clientId = 0;

class ServerNetwork extends EventDispatcher {

	constructor( props = {} ) {

		super();

		this.clients = props.clients || new Collection();
		this.ws = props.ws && props.ws.constructor !== Object && props.ws || this.createWS( props.ws );

	}

	send( data ) {

		if ( this.app ) {

			if ( data instanceof Array ) {

				for ( let i = 0; i < data.length; i ++ )
					if ( data[ i ].time === undefined ) data[ i ].time = this.app.time;

			} else if ( data.time === undefined ) data.time = this.app.time;

		}

		data = JSON.stringify( data, this.replacer );

		for ( let i = 0; i < this.clients.length; i ++ )
			this.clients[ i ].send( data );

	}

	createWS( props = {} ) {

		const ws = new Server( Object.assign( { port: 8081 }, props ) );

		ws.on( "connection", socket => {

			socket.id = clientId ++;
			socket.key = "c" + socket.id;
			this.clients.push( socket );

			socket.onclose = () => {

				this.clients.remove( socket );

				this.dispatchEvent( { type: "clientLeave", client: { id: socket.id } } );

			};

			socket.onmessage = data => {

				try {

					data = JSON.parse( data.data, this.reviver );

				} catch ( err ) {

					console.error( "Invalid message from client", socket.key );
					console.error( "May be a bug in the code or nefarious action" );

				}

				this.dispatchEvent( { type: "clientMessage", client: { id: socket.id }, message: data } );

			};

			this.dispatchEvent( { type: "clientJoin", client: { id: socket.id, send: data => {

				if ( typeof data !== "string" ) data = JSON.stringify( data, this.replacer );

				socket.send( data );

			} } } );

		} );

		return ws;

	}

}

export default ServerNetwork;
