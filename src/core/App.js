
import EventDispatcher from "./EventDispatcher.js";
import Terrain from "../entities/Terrain.js";
import RTSIntentSystem from "../intent-systems/RTSIntentSystem.js";
import ditto from "./ditto.js";
import Collection from "./Collection.js";
import Player from "./Player.js";
import Unit from "../entities/Unit.js";
import fetchFile from "../misc/fetchFile.js";

import ServerNetwork from "../networks/ServerNetwork.js";
import ClientNetwork from "../networks/ClientNetwork.js";

import models from "../entities/models.js";

const eval2 = eval;

class App extends EventDispatcher {

	constructor( props = {} ) {

		super();

		this.players = props.players || new Collection();
		this.units = props.units || new Collection();
		this.updates = props.updates || new Collection();

		this.initTerrain( props.terrain );
		this.initIntentSystem( props.intentSystem );
		this.initScene( props.scene );

		if ( App.isServer ) {

			this.initServerNetwork( props.network );
			this.renderer = props.renderer && props.renderer.constructor !== Object ? props.renderer : ditto();

		} else {

			this.initClientNetwork( props.network );
			this.initCamera( props.camera );
			this.renderer = props.renderer && props.renderer.constructor !== Object ? props.renderer : App.defaultRenderer( props.renderer );

			window.addEventListener( "resize", () => this.camera.resize() );
			window.addEventListener( "keydown", e => this.intentSystem.keydown && this.intentSystem.keydown( e ) );

		}

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

		this.terrain = props && props.constructor !== Object ? props : new Terrain( props );

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

		this.network.reviver = props.reviver || ( ( key, value ) => value );
		this.network.replacer = props.replacer || ( ( key, value ) => value );

		this.network.addEventListener( "clientJoin", props.clientJoin || ( e => this.clientJoinHandler( e ) ) );
		this.network.addEventListener( "clientLeave", props.clientLeave || ( e => this.clientLeaveHandler( e ) ) );
		this.network.addEventListener( "clientMessage", props.clientMessage || ( e => this.clientMessageHandler( e ) ) );
		this.network.addEventListener( "playerJoin", props.playerJoin || ( e => this.playerJoinHandler( e ) ) );

	}

	initClientNetwork( props = {} ) {

		this.network = props && props.constructor !== Object ?
			props :
			new ClientNetwork( props );

		this.network.reviver = props.reviver || ( ( key, value ) => value );
		this.network.replacer = props.replacer || ( ( key, value ) => value );

		this.network.addEventListener( "localPlayer", props.localPlayer || ( e => this.localPlayerHandler( e ) ) );
		this.network.addEventListener( "playerJoin", props.playerJoin || ( e => this.playerJoinHandler( e ) ) );
		this.network.addEventListener( "message", props.playerJoin || ( e => this.messageHandler( e ) ) );

	}

	clientJoinHandler( e ) {

		const player = new Player( Object.assign( { key: "p" + e.client.id }, e.client ) );

		player.send( { type: "localPlayer", player } );

		this.players.add( player );

		this.network.dispatchEvent( { type: "playerJoin", player } );
		this.network.send( { type: "playerJoin", player } );

	}

	clientLeaveHandler( e ) {

		const player = this.players.dict[ "p" + e.client.id ];

		this.network.dispatchEvent( { type: "playerLeave", player } );

		this.players.remove( player );
		player.color.taken = false;

		this.network.send( { type: "playerLeave", player } );

	}

	clientMessage( e ) {

	}

	messageHandler( e ) {

		const message = JSON.parse( e.message, this.reviver || ( ( key, value ) => value ) );

		console.log( message );

		this.network.dispatchEvent( message );

	}

	localPlayerHandler( e ) {

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

				super( Object.assign( {}, type, props ) );

				app.units.add( this );

				this.addEventListener( "meshLoaded", () => app.scene.add( this.mesh ) );
				this.addEventListener( "meshUnloaded", () => app.scene.remove( this.mesh ) );
				this.addEventListener( "dirty", () => ( console.log( "dirty add" ), app.updates.add( this ) ) );

			}

		};

		Object.defineProperty( this[ type.name ].constructor, "name", { value: type.name, configurable: true } );

	}

	// get terrain() {
    //
	// 	return this._terrain;
    //
	// }
    //
	// set terrain( value ) {
    //
	// 	this._terrain = value;
    //
	// }

	add( entity ) {

		this.units.add( entity );

	}

	update() {

		for ( let i = 0; i < this.updates.length; i ++ )
			if ( typeof this.updates[ i ] === "function" ) this.updates[ i ]();
			else if ( typeof this.updates[ i ].updates === "object" && this.updates[ i ].updates instanceof Array ) {

				for ( let n = 0; n < this.updates[ i ].updates.length; n ++ )
					this.updates[ i ].updates[ n ]();

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
