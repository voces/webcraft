
import EventDispatcher from "./util/EventDispatcher.js";

const propertyDefinitionKeys = [ "configurable", "enumerable", "value", "writable", "get", "set" ];
const isPropertyDefinition = val => {

	if ( typeof val !== "object" || val.constructor !== Object ) return false;

	const keys = Object.keys( val );

	if ( keys.length === 0 ) return false;
	return keys.every( key => propertyDefinitionKeys.includes( key ) );

};

export default class Game extends EventDispatcher {

	updateFrequency = 25;
	time; // Stores the current synced (update) time (unix)
	lastUpdate; // The last time the game updated; used for deltas (unix)
	lastRender; // The last time the game rendered; used for deltas (unix)
	renderRequest; // The requestAnimationRequest result; used to cleanup
	updateInterval; // The update interval; used to cleanup

	update = this.update.bind( this );
	render = this.render.bind( this );

	// TODO: make these private when supported by VSCode
	_systems = []; // Array of attached systems
	_mechanisms = []; // Array of attached mechanisms

	addSystem( system ) {

		this._systems.push( system );

		const attachments = system.attachments;
		if ( attachments )
			for ( const property in attachments )
				if ( attachments.hasOwnProperty( property ) )
					if ( property in this ) {

						const error = new Error( `System '${system}' attachment '${property}' trying to overwrite existing property.` );
						error.system = system;
						error.property = property;
						error.existingValue = this[ property ];
						throw error;

					} else if ( isPropertyDefinition( attachments[ property ] ) )
						Object.defineProperty( this, property, attachments[ property ] );

					else this[ property ] = attachments[ property ];

	}

	addMechanism( mechanism ) {

		this._mechanisms.push( mechanism );

		const attachments = mechanism.attachments;
		if ( attachments )
			for ( const property in attachments )
				if ( attachments.hasOwnProperty( property ) )
					if ( property in this ) {

						const error = new Error( `Merchanism '${mechanism}' attachment '${property}' trying to overwrite existing property.` );
						error.mechanism = mechanism;
						error.property = property;
						error.existingValue = this[ property ];
						throw error;

					} else if ( isPropertyDefinition( attachments[ property ] ) )
						Object.defineProperty( this, property, attachments[ property ] );

					else this[ property ] = attachments[ property ];

	}

	// Dispatches an event wrapper in a transmission, meant for networking
	transmit( event ) {

		this.dispatchEvent( "transmit", event );

	}

	// Game creates memory leaks via animation frame requests and the update loop
	// So we should manually clear them
	dispose() {

		// Kill render loop
		if ( this.renderRequest !== undefined )
			cancelAnimationFrame( this.renderRequest );

		// Kill update loops
		if ( this.updateInterval !== undefined )
			clearInterval( this.updateInterval );

		// Some systems/merchanisms may be leaky
		for ( let i = 0; i < this._systems.length; i ++ )
			this._systems[ i ].dispose();
		for ( let i = 0; i < this._mechanisms.length; i ++ )
			this._mechanisms[ i ].dispose();

	}

	add( ...objects ) {

		for ( let i = 0; i < objects.length; i ++ )
			for ( let n = 0; n < this._systems.length; n ++ )
				if ( this._systems[ n ].test( objects[ i ] ) )
					this._systems[ n ].add( objects[ i ] );

		return this;

	}

	remove( ...objects ) {

		for ( let i = 0; i < objects.length; i ++ )
			for ( let n = 0; n < this._systems.length; n ++ )
				this._systems[ n ].remove( objects[ i ] );

		return this;

	}

	// The animation loop
	// TODO: should we really do a render loop in Game as opposed to a system?
	render() {

		this.renderRequest = requestAnimationFrame( this.render );

		const thisRender = Date.now();
		const delta = thisRender - this.lastRender;

		for ( let i = 0; i < this._mechanisms.length; i ++ )
			if ( this._mechanisms[ i ].render )
				this._mechanisms[ i ].render( delta, thisRender );

		for ( let i = 0; i < this._systems.length; i ++ ) {

			if ( this._systems[ i ].preRender )
				this._systems[ i ].preRender( delta, thisRender );
			if ( this._systems[ i ].render )
				for ( let n = 0; n < this._systems[ i ].length; n ++ )
					this._systems[ i ].render( this._systems[ i ][ n ], delta, thisRender );
			if ( this._systems[ i ].postRender )
				this._systems[ i ].postRender( delta, thisRender );

		}

		this.lastRender = thisRender;

		return this;

	}

	// The logical loop
	update() {

		this.time = Date.now();
		const delta = this.time - this.lastUpdate;

		for ( let i = 0; i < this._mechanisms.length; i ++ )
			if ( this._mechanisms[ i ].update )
				this._mechanisms[ i ].update( delta, this.time );

		for ( let i = 0; i < this._systems.length; i ++ ) {

			if ( this._systems[ i ].preUpdate )
				this._systems[ i ].preUpdate( delta, this.time );
			if ( this._systems[ i ].update )
				for ( let n = 0; n < this._systems[ i ].length; n ++ )
					this._systems[ i ].update( this._systems[ i ][ n ], delta, this.time );
			if ( this._systems[ i ].postUpdate )
				this._systems[ i ].postUpdate( delta, this.time );

		}

		this.lastUpdate = this.time;

	}

	// A host need not pass in a time; a client should
	start( time = Date.now() ) {

		this.time = this.lastUpdate = this.lastRender = time;

		this.update();
		this.updateInterval = setInterval( this.update, this.updateFrequency );

		// Render automatically queues the next render
		this.render();

		return this;

	}

}
