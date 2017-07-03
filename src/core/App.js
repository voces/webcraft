
// Actually used by App
import EventDispatcher from "./EventDispatcher.js";
import Terrain from "../entities/Terrain.js";
import Collection from "./Collection.js";
import Unit from "../entities/Unit.js";
import fetchFile from "../misc/fetchFile.js";
import models from "../entities/models.js";
import * as env from "../misc/env.js";
import timeProperty from "./timeProperty.js";
import Random from "../../lib/seedrandom-alea.js";

import * as rts from "../presets/rts.js";

// Wrapped by App
import * as tweens from "../tweens/tweens.js";
import Rect from "../misc/Rect.js";

const eval2 = eval;

class App extends EventDispatcher {

	constructor( props = {} ) {

		super();

		// Time keeping
		this.time = 0;
		this.renderTime = 0;
		this.lastNow = Date.now();
		this.lastRender = this.lastNow;

		// Randomness
		this.initialSeed = props.seed || "webcraft";
		timeProperty( this, this, "random", true );
		this.random = new Random( this.initialSeed );

		this.handles = props.handles || new Collection();
		this.players = props.players || new Collection();
		this.units = props.units || new Collection();
		this.updates = props.updates || new Collection();
		this.renders = props.renders || new Collection();
		this.subevents = props.subevents || [];
		this.rects = props.rects || new Collection();

		if ( env.isServer ) Object.defineProperty( this, "officialTime", { get: () => this.time } );

		// Initialize the app components
		this.initTerrain( props.terrain );
		this.initScene( props.scene );
		this.eventSystem = Object.assign( {}, rts.eventSystem, props.eventSystem );
		this.intentSystem = Object.assign( {}, props.intentSystem );

		this.initFactories( props.types );

		this.addEventListener( "playerJoin", e => this.eventSystem.playerJoinHandler( this, e ) );
		this.addEventListener( "playerLeave", e => this.eventSystem.playerLeaveHandler( this, e ) );

		if ( props.network === undefined ) props.network = {};

		if ( props.network.reviver === undefined )
			props.network.reviver = ( key, value ) => {

			   if ( typeof value !== "object" || value._collection === undefined || value._key === undefined ) return value;

			   return this[ value._collection ].dict[ value._key ];

		   };

		// if ( props.network.replacer === undefined )
		// 	props.network.replacer = ( key, value ) => value;

		if ( env.isServer ) {

			this.initServerNetwork( props.network );

			this.addEventListener( "clientJoin", e => this.eventSystem.clientJoinHandler( this, e ) );
			this.addEventListener( "clientLeave", e => this.eventSystem.clientLeaveHandler( this, e ) );
			this.addEventListener( "clientMessage", e => this.eventSystem.clientMessageHandler( this, e ) );

			this.update();

		} else {

			this.initClientNetwork( props.network );
			this.initCamera( props.camera );
			this.renderer = props.renderer && props.renderer.constructor !== Object ? props.renderer : App.defaultRenderer( props.renderer );

			window.addEventListener( "resize", () => this.camera.resize() );
			window.addEventListener( "keydown", e => this.intentSystem.keydown && this.intentSystem.keydown( e ) );
			window.addEventListener( "keyup", e => this.intentSystem.keyup && this.intentSystem.keyup( e ) );

			this.addEventListener( "localPlayer", e => this.eventSystem.localPlayerHandler( this, e ) );

			this.render();

		}

	}

	static defaultRenderer() {

		const renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		renderer.setSize( window.innerWidth, window.innerHeight );

		if ( document.readyState === "complete" || document.readyState === "loaded" || document.readyState === "interactive" )
			document.body.appendChild( renderer );

		else document.addEventListener( "DOMContentLoaded", () => document.body.appendChild( renderer.domElement ) );

		return renderer;

	}

	initTerrain( props ) {

		this.terrain = props && props.constructor !== Object ? props : new Terrain( Object.assign( { app: this }, props ) );

	}

	initIntentSystem( props ) {

		this.intentSystem = props && props.constructor !== Object ? props : {};

	}

	initScene( props ) {

		this.scene = props && props instanceof THREE.Scene ?
			props :
			new THREE.Scene();

		// this.globalLight = new THREE.HemisphereLight( 0xffffbb, 0x080820 );
		this.globalLight = new THREE.HemisphereLight( 0xffffbb, 0x080820 );
		this.scene.add( this.globalLight );

		this.sun = new THREE.DirectionalLight( 0xffffff, 0.5 );
		this.sun.position.z = 5;
		this.sun.position.x = - 3;
		this.sun.position.y = - 7;
		this.scene.add( this.sun );

	}

	initCamera( props ) {

		this.camera = props && props instanceof THREE.Camera ?
			props :
			new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 10000 );

		// this.camera.resize = () => this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.resize = () => {

			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();

			this.renderer.setSize( window.innerWidth, window.innerHeight );

		};

		this.camera.position.z = 25;

	}

	initServerNetwork( props = {} ) {

		this.network = props.constructor !== Object ?
			props :
			new rts.ServerNetwork( Object.assign( { players: this.players }, props ) );

		this.network.app = this;

	}

	initClientNetwork( props = {} ) {

		this.network = props && props.constructor !== Object ?
			props :
			new rts.ClientNetwork( props );

		this.network.app = this;

	}

	initFactories( types ) {

		const app = this;

		for ( const tween in tweens ) this[ tween ] = obj => tweens[ tween ]( Object.assign( { startTime: this.time }, obj ) );

		this.Rect = class extends Rect {

			constructor( ...args ) {

				super( ...args );

				if ( this.app === undefined ) this.app = app;

				this.addEventListener( "dirty", () => app.updates.add( this ) );
				this.addEventListener( "clean", () => app.updates.remove( this ) );

			}

		};

		if ( types ) this.loadTypes( types );

	}

	loadTypes( types ) {

		if ( types.units ) this.loadUnitTypes( types.units );

	}

	loadUnitTypes( types ) {

		for ( let i = 0; i < types.length; i ++ )
			this.loadUnitType( types[ i ] );

	}

	loadUnitType( type ) {

		const app = this;

		if ( models[ type.model ] === undefined ) {

			models[ type.model ] = new EventDispatcher();
			fetchFile( type.model )
				.then( file => {

					const eventDispatcher = models[ type.model ];

					models[ type.model ] = eval2( file );

					eventDispatcher.dispatchEvent( { type: "ready", model: models[ type.model ] } );

				} )
				.catch( err => console.error( err ) );

		}

		this[ type.name ] = class extends Unit {

			constructor( props ) {

				super( Object.assign( { app }, type, props ) );

				app.units.add( this );

				this.addEventListener( "meshLoaded", () => app.scene.add( this.mesh ) );
				this.addEventListener( "meshUnloaded", () => app.scene.remove( this.mesh ) );

				this.addEventListener( "dirty", () => ( app.updates.add( this ), app.renders.add( this ) ) );
				this.addEventListener( "clean", () => ( app.updates.remove( this ), app.renders.remove( this ) ) );

			}

			static get name() {

				return type.name;

			}

		};

		Object.defineProperty( this[ type.name ].constructor, "name", { value: type.name, configurable: true } );

	}

	setTimeout( callback, time = 0 ) {

		const subevent = { time: this.time + time, callback };

		this.subevents.push( subevent );

		return subevent;

	}

	setInterval( callback, time = 0 ) {

		const wrappedCallback = time => {

			callback( time );
			subevent.time = this.time + time;
			this.subevents.push( subevent );

		};

		const subevent = { time: this.time + time, callback: wrappedCallback };

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

	update() {

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

				if ( subevents[ index ].callback ) subevents[ index ].callback( subevents[ index ].time );
				else if ( subevents[ index ].target ) subevents[ index ].target.dispatchEvent( subevents[ index ] );
				else this.dispatchEvent( subevents[ index ] );

				index ++;

			}

			this.time = oldTime;

		}

		if ( env.isServer ) this.network.send( this.time );
		setTimeout( () => this.update(), 25 );

	}

}

export default App;
