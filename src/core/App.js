
// Actually used by App
import EventDispatcher from "./EventDispatcher.js";
import Terrain from "../entities/Terrain.js";
import RTSIntentSystem from "../intents/RTSIntentSystem.js";
import ditto from "./ditto.js";
import Collection from "./Collection.js";
import Player from "./Player.js";
import Unit from "../entities/Unit.js";
import fetchFile from "../misc/fetchFile.js";
import ServerNetwork from "../networks/ServerNetwork.js";
import ClientNetwork from "../networks/ClientNetwork.js";
import models from "../entities/models.js";

// Wrapped by App
import * as tweens from "../tweens/tweens.js";
import Rect from "../misc/Rect.js";

const eval2 = eval;

class App extends EventDispatcher {

	constructor( props = {} ) {

		super();

		this.time = 0;
		this.lastNow = Date.now();

		this.players = props.players || new Collection();
		this.units = props.units || new Collection();
		this.updates = props.updates || new Collection();
		this.subevents = props.subevents || [];
		this.rects = props.rects || new Collection();

		this.initTerrain( props.terrain );
		this.initIntentSystem( props.intentSystem );
		this.initScene( props.scene );

		if ( props.network === undefined ) props.network = {};

		if ( props.network.reviver === undefined )
			props.network.reviver = ( key, value ) => {

				if ( typeof value !== "object" || value._collection === undefined || value._key === undefined ) return value;

				// console.log( value._collection, value._key );

				return this[ value._collection ].dict[ value._key ];

			};

		if ( props.network.replacer === undefined )
			props.network.replacer = ( key, value ) => value;

		if ( App.isServer ) {

			this.initServerNetwork( props.network );
			this.renderer = props.renderer && props.renderer.constructor !== Object ? props.renderer : ditto();

		} else {

			this.initClientNetwork( props.network );
			this.initCamera( props.camera );
			this.renderer = props.renderer && props.renderer.constructor !== Object ? props.renderer : App.defaultRenderer( props.renderer );

			window.addEventListener( "resize", () => this.camera.resize() );
			window.addEventListener( "keydown", e => this.intentSystem.keydown && this.intentSystem.keydown( e ) );
			window.addEventListener( "keyup", e => this.intentSystem.keyup && this.intentSystem.keyup( e ) );

		}

		for ( const tween in tweens )
			this[ tween ] = obj => tweens[ tween ]( Object.assign( { startTime: this.time }, obj ) );

		const app = this;

		this.Rect = class extends Rect {

			constructor( ...args ) {

				super( ...args );

				if ( this.app === undefined ) this.app = app;

				this.addEventListener( "dirty", () => ( console.log( "dirty" ), app.updates.add( this ) ) );
				this.addEventListener( "clean", () => app.updates.remove( this ) );

			}

		};

		if ( props.types ) this.loadTypes( props.types );

		this.update();

	}

	static get isServer() {

		if ( this._isServer !== undefined ) return this._isServer;

		this._isClient = new Function( "try {return this===window;}catch(e){ return false;}" )();
		this._isServer = ! this._isClient;

		return this._isServer;

	}

	static get isClient() {

		if ( this._isClient !== undefined ) return this._isClient;

		return ! this.isServer;

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

	get isServer() {

		if ( this._isServer !== undefined ) return this._isServer;

		this._isClient = new Function( "try {return this===window;}catch(e){ return false;}" )();
		this._isServer = ! this._isClient;

		return this._isServer;

	}

	get isClient() {

		if ( this._isClient !== undefined ) return this._isClient;

		return ! this.isServer;

	}

	initTerrain( props ) {

		this.terrain = props && props.constructor !== Object ? props : new Terrain( Object.assign( { app: this }, props ) );

	}

	initIntentSystem( props ) {

		this.intentSystem = props && props.constructor !== Object ? props : new RTSIntentSystem();

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
			new ServerNetwork( Object.assign( { players: this.players }, props ) );

		this.network.app = this;
		this.network.reviver = props.reviver;
		this.network.replacer = props.replacer;

		this.network.addEventListener( "clientJoin", props.clientJoin || ( e => this.clientJoinHandler( e ) ) );
		this.network.addEventListener( "clientLeave", props.clientLeave || ( e => this.clientLeaveHandler( e ) ) );
		this.network.addEventListener( "clientMessage", props.clientMessage || ( e => this.clientMessageHandler( e ) ) );
		this.network.addEventListener( "playerJoin", props.playerJoin || ( e => this.playerJoinHandler( e ) ) );

	}

	initClientNetwork( props = {} ) {

		this.network = props && props.constructor !== Object ?
			props :
			new ClientNetwork( props );

		this.network.app = this;
		this.network.reviver = props.reviver || App.defaultReviver();
		this.network.replacer = props.replacer || App.defaultReplacer();

		this.network.addEventListener( "localPlayer", props.localPlayer || ( e => this.localPlayerHandler( e ) ) );
		this.network.addEventListener( "playerJoin", props.playerJoin || ( e => this.playerJoinHandler( e ) ) );
		// this.network.addEventListener( "message", props.playerJoin || ( e => this.messageHandler( e ) ) );

	}

	clientJoinHandler( e ) {

		const player = new Player( Object.assign( { key: "p" + e.client.id }, e.client ) );

		player.send( { type: "localPlayer", time: this.time, player: {
			id: player.id,
			color: player.color
		} } );

		for ( let i = 0; i < this.players.length; i ++ ) {

			player.send( { type: "playerJoin", player: {
				id: this.players[ i ].id,
				color: this.players[ i ].color
			} } );

			this.players[ i ].send( { type: "playerJoin", player: {
				id: player.id,
				color: player.color
			} } );

		}

		this.players.add( player );

		this.network.dispatchEvent( { type: "playerJoin", player } );

	}

	clientLeaveHandler( e ) {

		const player = this.players.dict[ "p" + e.client.id ];

		this.network.dispatchEvent( { type: "playerLeave", player } );

		this.players.remove( player );
		player.color.taken = false;

		this.network.send( { type: "playerLeave", player } );

	}

	// This modifies the actual event, replacing client with player
	clientMessageHandler( e ) {

		if ( e.client ) {

			e.player = this.players.dict[ "p" + e.client.id ];
			delete e.client;

		}

	}

	messageHandler( e ) {

		const message = JSON.parse( e.data, this.reviver || ( ( key, value ) => value ) );

		this.network.dispatchEvent( message );

	}

	localPlayerHandler( e ) {

		this.time = e.time;

		const player = new Player( Object.assign( { key: "p" + e.player.id }, e.player ) );

		this.players.add( player );

		this.localPlayer = player;

	}

	playerJoinHandler( e ) {

		if ( this.isServer ) return;
		if ( this.players.dict[ "p" + e.player.id ] ) return;

		const player = new Player( Object.assign( { key: "p" + e.player.id }, e.player ) );

		this.players.add( player );

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
				this.addEventListener( "dirty", () => app.updates.add( this ) );
				this.addEventListener( "clean", () => app.updates.remove( this ) );

			}

		};

		Object.defineProperty( this[ type.name ].constructor, "name", { value: type.name, configurable: true } );

	}

	update() {

		const now = Date.now(),
			delta = now - this.lastNow;

		this.lastNow = now;
		this.time += delta;

		for ( let i = 0; i < this.updates.length; i ++ )
			if ( typeof this.updates[ i ] === "function" ) this.updates[ i ]( this.time );
			else if ( typeof this.updates[ i ] === "object" ) {

				if ( this.updates[ i ].update ) this.updates[ i ].update( this.time );
				else if ( this.updates[ i ].updates ) {

					for ( let n = 0; n < this.updates[ i ].updates.length; n ++ )
						this.uodates[ i ].updates[ n ]( this.time );

				}

			}

		if ( this.subevents.length ) {

			const oldTime = this.time;

			this.subevents.sort( ( a, b ) => a.time - b.time );

			if ( App.isServer ) this.network.send( this.subevents );

			for ( let i = 0; i < this.subevents.length; i ++ ) {

				if ( this.subevents[ i ].time ) this.time = this.subevents[ i ].time;

				if ( this.subevents[ i ].target ) this.subevents[ i ].target.dispatchEvent( this.subevents[ i ] );
				else this.dispatchEvent( this.subevents[ i ] );

			}

			this.time = oldTime;
			this.subevents = [];

		}

		if ( App.isClient ) {

			this.renderer.render( this.scene, this.camera );
			requestAnimationFrame( () => this.update() );

		} else {

			setTimeout( () => this.update(), 1000 / 60 );

		}

	}

}

export default App;
