
import { toCamelCase } from "./util/string.mjs";

export default class Game {

	constructor() {

		Object.defineProperty( this, "_systems", { value: [] } );
		Object.defineProperty( this, "_mechanisms", { value: [] } );

		this.lastUpdate = this.lastRender = this.time = Date.now();

	}

	addSystem( system ) {

		const camelName = toCamelCase( system.constructor.name );
		if ( this[ camelName ] )
			throw new Error( `A '${system.constructor.name}' system or mechanism has already been added to this game.` );

		this._systems.push( system );
		this[ camelName ] = system;

	}

	addMechanism( mechanism ) {

		const camelName = toCamelCase( mechanism.constructor.name );
		if ( this[ camelName ] )
			throw new Error( `A '${mechanism.constructor.name}' mechanism has already been added to this game.` );

		this._mechanisms.push( mechanism );
		this[ camelName ] = mechanism;

	}

	dispose() {

		// Kill render loop
		if ( this.renderRequest !== undefined )
			cancelAnimationFrame( this.renderRequest );

		// Kill update loops
		if ( this.updateInterval !== undefined )
			clearInterval( this.updateInterval );

		// Some systems may be leaky
		for ( let i = 0; i < this._systems.length; i ++ )
			this._systems[ i ].dispose();

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
	render() {

		this.renderRequest = requestAnimationFrame( () => this.render() );

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

	start() {

		this.update();
		this.updateInterval = setInterval( () => this.update(), 25 );

		this.render();

		return this;

	}

}
