
import EventDispatcher from "../../core/EventDispatcher.js";
import Handle from "../../core/Handle.js";
import Collection from "../../core/Collection.js";
import stringify from "../../misc/stringify.js";

class GenericServer extends EventDispatcher {

	constructor( props = {} ) {

		super();

		this.clients = props.clients || new Collection();

		if ( ! props.ws || props.ws.constructor === Object ) this.createWS( props );
		else this.ws = props.ws;

	}

	send( data, toJSON ) {

		if ( typeof data === "object" ) {

			if ( this.app )
				if ( data instanceof Array ) {

					for ( let i = 0; i < data.length; i ++ )
						if ( data[ i ].time === undefined ) data[ i ].time = this.app.time;

				} else if ( data.time === undefined ) data.time = this.app.time;

			if ( toJSON ) data = stringify( data, this.replacer, toJSON );
			else data = JSON.stringify( data, this.replacer );

		} else if ( typeof data !== "string" ) data = data.toString();

		for ( let i = 0; i < this.clients.length; i ++ ) {

			try {

				this.clients[ i ].send( data );

			} catch ( err ) { /* do nothing */ }

			this.charsSent += data.length;

		}

	}

	async createWS( props = {} ) {

		const WebSocket = await import( "ws" );

		const ws = new WebSocket.Server( { port: props.port || 3000 } );
		console.log( "Listening on", props.port || 3000 );

		ws.on( "connection", socket => {

			socket.id = ( Handle.id ) ++;
			socket.key = "c" + socket.id;
			this.clients.add( socket );
			console.log( "Connection from", socket._socket.remoteAddress, "on", socket._socket.remotePort, "as", socket.id );

			socket.onclose = () => {

				console.log( "Disconnection", socket.id );

				this.clients.remove( socket );

				this.app.dispatchEvent( "clientLeave", { client: { id: socket.id } } );

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

				this.app.dispatchEvent( "clientMessage", { client: { id: socket.id }, message: data } );

			};

			this.app.dispatchEvent( "clientJoin", { client: { id: socket.id, send: ( data, toJSON ) => {

				if ( typeof data === "object" ) {

					if ( this.app )
						if ( data instanceof Array ) {

							for ( let i = 0; i < data.length; i ++ )
								if ( data[ i ].time === undefined ) data[ i ].time = this.app.time;

						} else if ( data.time === undefined ) data.time = this.app.time;

					if ( toJSON ) data = stringify( data, this.replacer, toJSON );
					else data = JSON.stringify( data, this.replacer );

				}

				try {

					socket.send( data );

				} catch ( err ) { /* do nothing */ }

			} } } );

		} );

		this.ws = ws;
		this.dispatchEvent( "ready" );

	}

}

export default GenericServer;
