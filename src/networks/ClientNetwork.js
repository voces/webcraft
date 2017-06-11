
import EventDispatcher from "../core/EventDispatcher";

class ClientNetwork extends EventDispatcher {

	constructor( props = {} ) {

		super();

		this.protocol = props.protocol || "ws";
		this.host = props.host || "localhost";
		this.port = props.port || 8081;
		this.app = props.app;

		this.connect();

	}

	connect() {

		this.socket = new WebSocket( `${this.protocol}://${this.host}:${this.port}` );

		this.socket.addEventListener( "message", console.log );
		this.socket.addEventListener( "message", e => {

			e = JSON.parse( e.data, this.reviver );

			if ( this.app && e.time ) this.app.time = e.time;

			this.dispatchEvent( e );

		} );
		this.socket.addEventListener( "open", () => this.dispatchEvent( "open" ) );
		this.socket.addEventListener( "close", () => this.onClose() );

	}

	onClose() {

		this.dispatchEvent( "close" );

		if ( this.autoReconnect ) this.connect();

	}

	send( data ) {

		data = JSON.stringify( data, this.replacer );

		this.socket.send( data );

	}

}

export default ClientNetwork;
