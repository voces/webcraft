
import ECS from "../node_modules/knack-ecs/src/App.js";

import Player from "./entities/Player.js";
import alea from "../lib/alea.js";
import { commonConstructor, isBrowser } from "./util.js";

export default class App extends ECS {

	static get Player() {

		return Player;

	}

	constructor( props = {} ) {

		super();

		this.isHost = props.isHost === undefined ? ! isBrowser : props.isHost;

		Object.defineProperties( this, {
			updateFrequency: { value: props.updateFrequency || 30 },
			buffer: { value: props.buffer || 5 },
			bufferedEvents: { value: [], writable: true }
		} );

		if ( props.clientTransmit ) this.clientTransmit = props.clientTransmit;
		else if ( ! this.isHost ) throw new Error( "Clients must pass in clientTransmit" );

		if ( props.hostTransmit ) this.hostTransmit = props.hostTransmit;
		else if ( ! isBrowser ) throw new Error( "Hosts must pass in hostTransmit" );

		commonConstructor( this, props, this );

		this.addEventListener( "join", () => {

			if ( ! this.random )
				throw new Error( "app#onJoin did not set app#random; try calling super.onJoin( event )" );

		} );

	}

	// For browser-agents; namely graphical stuff
	initBrowser() {

		requestAnimationFrame( this.render.bind( this ) );

	}

	// For the host
	initHost( props = {} ) {

		// Default with a seed
		this.seed = Date.now();
		this.random = alea( this.seed );

		// Single player :)
		if ( props.account ) {

			this.localPlayer = new this.constructor.Player( { account: props.account } );
			this.addEntity( this.localPlayer );
			this.transmit( "join", { account: props.account } );

		}

		// Start the update loops!
		this.update.last = Date.now();
		setTimeout( this.update.bind( this ), this.updateFrequency );

	}

	// Directly invoked from the host service
	onJoinOnHost( account ) {

		const event = { account, seed: Date.now() };
		event.time = event.seed;

		this.transmit( "join", event );
		this.dispatchEvent( "join", event );

	}

	onJoin( e ) {

		this.seed = e.seed;
		this.random = alea( e.seed );

		this.addEntity( new this.constructor.Player( { account: e.account } ) );

	}

	// Directly invoked from the host service
	onLeaveOnHost( account ) {

		// We will immediately transmit the leave event
		this.transmit( "leave", { account } );

	}

	transmit( type, data = {} ) {

		// Normalize data
		if ( typeof type === "object" ) {

			if ( typeof data.type !== "string" )
				throw new Error( "Must pass a type to transmit" );

			data = type;
			type = data.type;

		} else data.type = type;

		// Use a handler
		if ( this.isHost ) return this.hostTransmit( data );
		return this.clientTransmit( data );

	}

	clientTransmit( data ) {

		const now = Date.now();
		this.update( now );
		data.time = now;
		data.account = this.localPlayer.account;
		this.receive( data );

	}

	hostTransmit( data ) {

		if ( this.localPlayer ) data.account = this.localPlayer.account;

		const now = Date.now();
		if ( now - this.update.last < this.buffer ) {

			this.update( now );
			data.time = now;
			return this.dispatchEvent( data.type, data );

		}

		this.bufferedEvents.push( data );

	}

	receive( event ) {

		const eventType = event.type || "receive";

		// Clients should simply fire it
		if ( ! this.isHost ) return this.dispatchEvent( eventType, event );

		// Hosts will buffer it, then fire & transmit it
		const now = Date.now();
		if ( now - this.update.last < this.buffer ) {

			this.update( now );
			event.time = now;
			this.transmit( eventType, event );
			return this.dispatchEvent( eventType, event );

		}

		this.bufferedEvents.push( event );

	}

	addEntity( entity ) {

		try {

			entity.app = this;

		} catch ( err ) {

			console.error( entity );
			throw new Error( "Entity#app must be writable" );

		}

		return super.addEntity( entity );

	}

	addSystem( system ) {

		system.app = this;
		system.random = ( ...args ) => this.random( ...args );
		return super.addSystem( system );

	}

	// Make sure we are updated when dispatching; update will only process once per time
	dispatchEvent( type, event, ...args ) {

		this.update( typeof event === "object" ? event.time : undefined );
		super.dispatchEvent( type, event, ...args );

	}

	onUpdate( { time } ) {

		if ( ! this.isHost ) this.update( time );

	}

	update( time ) {

		// Update ticks
		const now = time || Date.now();
		const delta = now - this.update.last;
		this.update.last = now;

		// We've already updated this timestamp: only update once!
		if ( delta === 0 ) return;

		// If we have buffered events, send them out first
		if ( this.bufferedEvents.length ) {

			this.bufferedEvents.forEach( ( event, index ) => {

				event.time = now;
				this.transmit( event.type, event );
				if ( event.index === undefined ) event.index = index;
				try {

					this.dispatchEvent( event.type, event );

				} catch ( err ) {

					console.error( err );

				}

			} );

			this.bufferedEvents = [];

		// Otherwise send a blank update event

		} else if ( this.isHost ) this.transmit( "update" );

		// Update the game state
		super.update( delta );

		// Schedule the next update
		if ( this.isHost ) {

			if ( this.update.timeout ) clearTimeout( this.update.timeout );
			this.update.timeout = setTimeout( this.update.bind( this ), this.updateFrequency );

		}

	}

	render( elapsed ) {

		requestAnimationFrame( elapsed => this.render( elapsed ) );
		if ( ! this.render.last ) {

			this.render.last = elapsed;
			return;

		}

		const delta = elapsed - this.render.last;
		this.render.last = elapsed;

		super.render( delta );

	}

}
