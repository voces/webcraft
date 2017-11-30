
// Actually used by App
import { Scene, HemisphereLight, DirectionalLight, Camera, PerspectiveCamera } from "../../node_modules/three/build/three.module.js";

import Collection from "./Collection.js";
import EventDispatcher from "./EventDispatcher.js";
import Player from "./Player.js";

import Terrain from "../entities/Terrain.js";
import Unit from "../entities/Unit.js";
import Doodad from "../entities/Doodad.js";
import * as env from "../misc/env.js";

import Random from "../../lib/seedrandom-alea.js";

import * as gk from "../presets/gk.js";

// Wrapped by App
import Rect from "../misc/Rect.js";
import * as tweens from "../tweens/tweens.js";

class App extends EventDispatcher {

	constructor( props ) {

		super();

		if ( ! props.base ) throw "You must specify a base.";
		this.baseHref = props.base.endsWith( "/" ) ? props.base : props.base + "/";

		this.state = {};

		// Time keeping
		this.time = 0;
		this.renderTime = 0;
		this.lastNow = Date.now();
		this.lastRender = this.lastNow;
		if ( env.isServer ) Object.defineProperty( this, "officialTime", { get: () => this.time } );

		// Randomness
		this.initialSeed = props.seed || Math.random();
		this.random = new Random( this.initialSeed );

		// Collections & Arrays
		this.handles = props.handles || new Collection();
		this.players = props.players || new Collection();
		this.units = props.units || new Collection();
		this.doodads = props.doodads || new Collection();
		this.rects = props.rects || new Collection();
		this.updates = props.updates || new Collection();
		this.renders = props.renders || new Collection();
		this.subevents = props.subevents || [];

		Object.defineProperty( this.players, "here", {
			get: () => this.players.filter( player => player.status === "here" )
		} );

		// Initialize the app components
		if ( props.eventSystem ) props.eventSystem( this );
		else gk.eventSystem( this );

		this.initTerrain( props.terrain );
		this.initScene( props.scene );
		this.initFactories( props.types );
		this.initNetwork( props.network );

		// Initialze the app browser components (graphics, ui, intents)
		if ( env.isBrowser ) this.initBrowserComponents( props );

		// Start our primary loop
		if ( env.isServer ) this.update();
		if ( env.isBrowser ) this.render();

	}

	initTerrain( props ) {

		this.terrain = props && props.constructor !== Object ? props : new Terrain( Object.assign( { units: this.units }, props ) );

	}

	initScene( props ) {

		this.scene = props && props instanceof Scene ?
			props :
			new Scene();

		this.globalLight = new HemisphereLight( 0xffffbb, 0x080820 );
		this.scene.add( this.globalLight );

		this.sun = new DirectionalLight( 0xffffff, 0.5 );
		this.sun.position.z = 5;
		this.sun.position.x = - 3;
		this.sun.position.y = - 7;
		this.scene.add( this.sun );

	}

	initBrowserComponents( props ) {

		this.initCamera( props.camera );
		this.renderer = props.renderer && props.renderer.constructor !== Object ? props.renderer : gk.renderer( props.renderer );

		window.addEventListener( "resize", () => this.camera.resize() );

	}

	initCamera( props ) {

		this.camera = props && props instanceof Camera ?
			props :
			new PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 10000 );

		this.camera.resize = () => {

			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();

			this.renderer.setSize( window.innerWidth, window.innerHeight );

		};

		this.camera.position.z = 25;

	}

	initNetwork( props = {} ) {

		if ( props.reviver === undefined )
			props.reviver = ( key, value ) => {

				// Primitive
				if ( value == null || typeof value !== "object" ) return value;

				if ( value._collection !== undefined && value.key !== undefined ) {

					// Try fetching from collection
					let obj = this[ value._collection ].dict[ value.key ];

					// Create it if recongized constructor
					if ( ! obj && value._constructor )
						obj = new this[ value._constructor ]( { key: value.key } );

					// Expand out properties
					for ( const prop in value )
						if ( ! [ "key", "_collection", "_constructor", "_function" ].includes( prop ) )
							value[ prop ] = props.reviver( prop, value[ prop ] );

					// Apply properties
					if ( obj )
						for ( const prop in value )
							if ( ! [ "key", "_collection", "_constructor", "_function" ].includes( "prop" ) )
								obj[ prop ] = value[ prop ];

					return obj;

				}

				// Not collectable, but still a constructable
				if ( value._constructor ) {

					const obj = new this[ value._constructor ]( { key: value.key } );

					for ( const prop in value )
						if ( ! [ "key", "_collection", "_constructor", "_function" ].includes( prop ) )
							value[ prop ] = props.reviver( prop, value[ prop ] );

					if ( obj )
						for ( const prop in value )
							if ( ! [ "key", "_collection", "_constructor", "_function" ].includes( "prop" ) )
								obj[ prop ] = value[ prop ];

					return obj;

				}

				// A function without applied properties
				if ( value._function ) return this[ value._function ]( value );

				return value;

			};

		if ( env.isServer ) this.initServerNetwork( props );
		else this.initClientNetwork( props );

	}

	initServerNetwork( props = {} ) {

		this.network = props.constructor !== Object ?
			props :
			new gk.ServerNetwork( Object.assign( { players: this.players }, props ) );

		this.network.app = this;

	}

	initClientNetwork( props = {} ) {

		this.network = props && props.constructor !== Object ?
			props :
			new gk.ClientNetwork( props );

		this.network.app = this;

	}

	initFactories( types ) {

		const app = this;

		this.Player = class extends Player {

			constructor( props ) {

				super( Object.assign( { app }, props ) );

				app.players.add( this );
				app.players.sort( ( a, b ) => a.id > b.id ? 1 : - 1 );

				this.addEventListener( "remove", () => app.players.remove( this ) );

			}

		};

		for ( const tween in tweens )
			this[ tween ] = obj => {

				const tweenFunc = tweens[ tween ]( Object.assign( { startTime: this.time }, obj ) );
				Object.defineProperty( tweenFunc, "time", { get: () => app.time } );

				return tweenFunc;

			};

		this.Rect = class extends Rect {

			constructor( ...args ) {

				args[ 4 ] = Object.assign( {
					candidateUnits: app.units,
					candidateDoodads: app.doodads
				}, args[ 4 ] );

				super( ...args );

				Object.defineProperty( this, "time", { get: () => app.time } );

				this.addEventListener( "dirty", () => app.updates.add( this ) );
				this.addEventListener( "clean", () => app.updates.remove( this ) );
				this.addEventListener( "subevents", ( { subevents } ) => app.subevents.push( ...subevents ) );

			}

		};

		if ( types ) this.loadTypes( types );

	}

	loadTypes( types ) {

		if ( types.units ) this.loadUnitTypes( types.units );
		if ( types.doodads ) this.loadDoodadTypes( types.doodads );

	}

	loadUnitTypes( types ) {

		for ( let i = 0; i < types.length; i ++ )
			this.loadUnitType( types[ i ] );

	}

	loadDoodadTypes( types ) {

		for ( let i = 0; i < types.length; i ++ )
			this.loadDoodadType( types[ i ] );

	}

	attachDooodadEvents( doodad ) {

		doodad.addEventListener( "subevents", ( { subevents } ) => this.subevents.push( ...subevents ) );

		if ( doodad.mesh ) this.scene.add( doodad.mesh );
		else doodad.addEventListener( "meshLoaded", () => this.scene.add( doodad.mesh ) );

		doodad.addEventListener( "meshUnloaded", () => this.scene.remove( doodad.mesh ) );

		doodad.addEventListener( "dirty", () => ( this.updates.add( doodad ), this.renders.add( doodad ) ) );
		doodad.addEventListener( "clean", () => ( this.updates.remove( doodad ), this.renders.remove( doodad ) ) );
		doodad.addEventListener( "remove", () => {

			this.updates.remove( doodad );
			this.renders.remove( doodad );

			if ( doodad instanceof Unit ) this.units.remove( doodad );
			else this.doodads.remove( doodad );

		} );

	}

	loadUnitType( type ) {

		const app = this;

		this[ type.name ] = class extends Unit {

			static get name() {

				return type.name;

			}

			constructor( props ) {

				super( Object.assign( { app, base: app.baseHref }, type, props ) );

				app.units.add( this );

				app.attachDooodadEvents( this );

			}

			toString() {

				return this.name;

			}

		};

	}

	loadDoodadType( type ) {

		const app = this;

		this[ type.name ] = class extends Doodad {

			static get name() {

				return type.name;

			}

			constructor( props ) {

				super( Object.assign( { app, base: app.baseHref }, type, props ) );

				app.doodads.add( this );

				app.attachDooodadEvents( this );

			}

		};

		Object.defineProperty( this[ type.name ].constructor, "name", { value: type.name, configurable: true } );

	}

	setTimeout( callback, wait = 0, absolute = false ) {

		const subevent = { time: absolute ? wait : this.time + wait, callback, clear: () => {

			const index = this.subevents.indexOf( subevent );
			if ( index >= 0 ) this.subevents.splice( index, 1 );

		} };

		this.subevents.push( subevent );

		return subevent;

	}

	setInterval( callback, interval = 1, absolute ) {

		const wrappedCallback = time => {

			this.subevents.push( subevent );
			callback( time );
			subevent.time = this.time + interval;

		};

		const subevent = { time: absolute || this.time + interval, callback: wrappedCallback, interval, clear: () => {

			const index = this.subevents.indexOf( subevent );
			if ( index >= 0 ) this.subevents.splice( index, 1 );

		} };

		this.subevents.push( subevent );

		return subevent;

	}

	render() {

		window.requestAnimationFrame( () => this.render() );

		const now = Date.now();
		const delta = now - this.lastRender;

		this.lastRender = now;
		this.renderTime += delta;

		for ( let i = 0; i < this.renders.length; i ++ )
			if ( typeof this.renders[ i ] === "function" ) this.renders[ i ]( this.renderTime );
			else if ( typeof this.renders[ i ] === "object" ) {

				if ( this.renders[ i ].render ) this.renders[ i ].render( this.renderTime );
				else if ( this.renders[ i ].renders )
					for ( let n = 0; n < this.renders[ i ].renders.length; n ++ )
						this.uodates[ i ].renders[ n ]( this.renderTime );

			}

		this.renderer.render( this.scene, this.camera );

	}

	update( consistencyUpdate = false ) {

		if ( env.isServer ) {

			const now = Date.now();
			const delta = now - this.lastNow;

			this.lastNow = now;
			this.time += delta;

		} else if ( env.isBrowser ) this.renderTime = this.time;

		for ( let i = 0; i < this.updates.length; i ++ )
			if ( typeof this.updates[ i ] === "function" ) this.updates[ i ]( this.time );
			else if ( typeof this.updates[ i ] === "object" ) {

				if ( this.updates[ i ].update ) this.updates[ i ].update( this.time );
				else if ( this.updates[ i ].updates )
					for ( let n = 0; n < this.updates[ i ].updates.length; n ++ )
						this.uodates[ i ].updates[ n ]( this.time );

			}

		if ( this.subevents.length ) {

			const oldTime = this.time;

			this.subevents.sort( ( a, b ) => a.time - b.time );

			// Use a clone to prevent infinite loops
			const subevents = this.subevents.slice( 0 );

			let index = 0;
			while ( true ) {

				if ( index === subevents.length ) {

					if ( index === this.subevents.length ) this.subevents = [];
					else this.subevents.splice( 0, index );
					break;

				} else if ( subevents[ index ].time > this.officialTime ) {

					this.subevents.splice( 0, index );
					break;

				}

				this.time = subevents[ index ].time;

				if ( subevents[ index ].callback ) subevents[ index ].callback( subevents[ index ] );
				else {

					const type = subevents[ index ].type || subevents[ index ][ 0 ] && subevents[ index ][ 0 ].type || "subevent";
					if ( subevents[ index ].target ) subevents[ index ].target.dispatchEvent( type, subevents[ index ] );
					else this.dispatchEvent( type, subevents[ index ] );

				}

				index ++;

			}

			this.time = oldTime;

		}

		if ( env.isServer && ! consistencyUpdate ) {

			this.network.send( this.time );
			setTimeout( () => this.update(), 25 );

		}

	}

}

export default App;
