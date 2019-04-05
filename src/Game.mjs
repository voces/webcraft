
import { Clock } from "../node_modules/three/build/three.module.js";
import { toCamelCase } from "./util/string.mjs";
import System from "./System.mjs";

export default class Game {

	constructor() {

		Object.defineProperty( this, "_systems", { value: [] } );
		Object.defineProperty( this, "_mechanisms", { value: [] } );

	}

	addSystem( system ) {

		const camelName = toCamelCase( system.constructor.name );
		if ( this[ camelName ] )
			throw new Error( `A '${system.constructor.name}' system or mechanism has already been added to this game.` );

		this._systems.push( system );
		this[ camelName ] = system;

	}

	addMechanism( mechanism ) {

		if ( mechanism instanceof System )
			throw new Error( "Systems should be added via Game#addSystem" );

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

		this.renderRequest = requestAnimationFrame( () =>
			this.render( this.renderClock ) );

		for ( let i = 0; i < this._mechanisms.length; i ++ )
			this._mechanisms[ i ].render();

		for ( let i = 0; i < this._systems.length; i ++ )
			this._systems[ i ].render();

		return this;

	}

	// The logical loop
	update() {

		for ( let i = 0; i < this._mechanisms.length; i ++ )
			this._mechanisms[ i ].update();

		for ( let i = 0; i < this._systems.length; i ++ )
			this._systems[ i ].update();

	}

	start() {

		if ( ! this.updateClock ) this.updateClock = new Clock();
		if ( ! this.renderClock ) this.renderClock = new Clock();

		this.update( this.updateClock );
		this.updateInterval = setInterval( () =>
			this.update( this.updateClock ), 25 );

		this.render( this.renderClock );

		return this;

	}

}
