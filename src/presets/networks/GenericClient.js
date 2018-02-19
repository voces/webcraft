
import EventDispatcher from "../../core/EventDispatcher.js";

class GenericClient extends EventDispatcher {

	constructor( props = {} ) {

		super();

		this.protocol = props.protocol || "ws";
		this.host = props.host || "localhost";
		this.port = props.port || 3000;
		this.app = props.app;
		this.reviver = props.reviver;

		this.connect();

	}

	connect() {

		this.socket = new WebSocket( `${this.protocol}://${this.host}:${this.port}` );

		this.socket.addEventListener( "message", e => {

			e = JSON.parse( e.data, this.reviver );

			if ( typeof e === "number" ) {

				this.app.time = e;
				this.app.officialTime = e;
				this.app.update();
				this.app.dispatchEvent( "time", { time: e } );

			} else if ( e instanceof Array )

				for ( let i = 0; i < e.length; i ++ ) {

					if ( this.app && e[ i ].time ) {

						const oldTime = this.app.officialTime;

						this.app.time = e[ i ].time;
						this.app.officialTime = e[ i ].time;

						if ( oldTime !== this.app.officialTime ) this.app.update();

					}

					this.app.dispatchEvent( e[ i ].type, e[ i ] );

				}

			else {

				if ( this.app && e.time ) {

					const oldTime = this.app.officialTime;

					this.app.time = e.time;
					this.app.officialTime = e.time;

					if ( oldTime !== this.app.officialTime ) this.app.update();

				}

				this.app.dispatchEvent( e.type, e );

			}

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

export default GenericClient;
