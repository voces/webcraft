import { Server } from 'ws';

class Collection extends Array {

	constructor( ...args ) {

		super( ...args );

		this.key = Collection.defaultKey;
		this.dict = {};

	}

	add( ...items ) {

		this.push( ...items );

		for ( let i = 0; i < items.length; i ++ )
			if ( items[ i ][ this.key ] !== undefined )
				this.dict[ items[ i ][ this.key ] ] = items[ i ];

	}

	replace( arr ) {

		this.splice( 0 );
		this.dict = {};

		this.add( ...arr );

	}

	remove( item ) {

		const index = this.indexOf( item );
		if ( index >= 0 ) this.splice( index, 1 );

		//Is the second condition required? How does it effect speed?
		if ( item[ this.key ] !== undefined && this.dict[ item[ this.key ] ] )
			delete this.dict[ item[ this.key ] ];

	}

}

Collection.defaultKey = "key";

const isBrowser = new Function( "try {return this===window;}catch(e){ return false;}" )();
const isClient = new Function( "try {return this===window;}catch(e){ return false;}" )();
const isServer = ! new Function( "try {return this===window;}catch(e){ return false;}" )();

// Adapted from THREE.js

class EventDispatcher {

	get _listenerCount() {

		let count = 0;

		for ( const prop in this._listeners )
			count += this._listeners[ prop ].length;

		return count;

	}

	addEventListener( types, listener ) {

		if ( types.indexOf( " " ) !== - 1 ) types.split( " " ).map( type => this.addEventListener( type, listener ) );

		if ( this._listeners === undefined ) this._listeners = {};

		if ( this._listeners[ types ] === undefined )
			this._listeners[ types ] = [];

		if ( this._listeners[ types ].indexOf( listener ) === - 1 )
			this._listeners[ types ].push( listener );

	}

	hasEventListener( type, listener ) {

		if ( this._listeners === undefined ) return;

		return this._listeners[ type ] !== undefined && this._listeners[ type ].indexOf( listener ) !== - 1;

	}

	removeEventListener( type, listener ) {

		if ( this._listeners === undefined ) return;

		if ( this._listeners[ type ] === undefined ) return;

		const index = this._listeners[ type ].indexOf( listener );
		if ( index !== - 1 ) this._listeners[ type ].splice( index, 1 );

	}

	dispatchEvent( event, received ) {

		if ( this._listeners === undefined ) return;

		const arr = this._listeners[ event.type ];
		if ( arr === undefined || arr.length === 0 ) return;

		if ( isClient && ! received )
			event.type = event.type + "Prediction";

		const clone = arr.slice( 0 );

		for ( let i = 0; i < clone.length; i ++ )
			try {

				clone[ i ].call( this, event );

			} catch ( err ) {

				// Report user errors but continue on
				console.error( err );

			}

	}

}

class Handle extends EventDispatcher {

	constructor( props ) {

		super();

		if ( props.id === undefined )
			this.id = ( Handle.id ) ++;

	}

	get key() {

		return "h" + this.id;

	}

	set key( value ) {

		this.id = value.slice( 1 );

	}

	get entityType() {

		let proto = this;

		while ( proto && Handle.entityTypes.indexOf( proto.constructor.name ) === - 1 )
			proto = Object.getPrototypeOf( proto );

		if ( ! proto ) return;

		return proto.constructor;

	}

	toState() {

		return Object.assign( {
			_key: this.key,
			_collection: this.entityType.name.toLowerCase() + "s",
			_constructor: this.constructor.name
		} );

	}

	toJSON() {

		return {
			_key: this.key,
			_collection: this.entityType.name.toLowerCase() + "s"
		};

	}

}

Handle.entityTypes = [ "Doodad", "Unit", "Player", "Rect" ];
Handle.id = 0;

class Player extends Handle {

	constructor( props = {} ) {

		super( props );

		this.shadowProps = {};

		if ( this.entityType === Player )
			Object.assign( this, { color: Player.getNextColor() }, props );

	}

	static getNextColor() {

		let i = 0;
		while ( i < Player.colors.length && Player.colors[ i ].taken )
			i ++;

		if ( i === Player.colors.length )
			console.error( "This is awkward" );

		return i;

	}

	get key() {

		return "p" + this.id;

	}

	set key( key ) {

		this.id = parseInt( key.slice( 1 ) );

	}

	get color() {

		return this.shadowProps.color;

	}

	set color( color ) {

		if ( typeof color === "number" ) color = Player.colors[ color ];
		else if ( typeof color === "string" ) color = Player.colors.find( c => c.name === color || c.hex === color );
		else return;

		if ( ! color ) return;

		if ( this.shadowProps.color ) this.shadowProps.color.taken = false;

		this.shadowProps.color = color;
		this.shadowProps.color.taken = true;

	}

	destroy() {

		this.color.taken = false;

	}

	toState() {

		return Object.assign( this.toJSON(), {
			_constructor: this.constructor.name,
			color: Player.colors.indexOf( this.color )
		} );

	}

	toJSON() {

		return {
			_key: this.key,
			_collection: "players"
		};

	}

}

Player.colors = [
    { name: "red", hex: "#FF0000" },
    { name: "blue", hex: "#4385FF" },
    { name: "cyan", hex: "#64FFFF" },
    { name: "purple", hex: "#820096" },
    { name: "yellow", hex: "#FFEA00" },
    { name: "orange", hex: "#FF9900" },
    { name: "lime", hex: "#BEFF00" },
    { name: "magenta", hex: "#FF00FF" },
    { name: "grey", hex: "#808080" },
    { name: "mint", hex: "#AAFFC3" },
    { name: "green", hex: "#00BE00" },
    { name: "brown", hex: "#AA6E28" },
    { name: "maroon", hex: "#800000" },
    { name: "navy", hex: "#000080" },
    { name: "olive", hex: "#808000" },
    { name: "teal", hex: "#008080" },
    { name: "lavender", hex: "#E6BEFF" },
    { name: "pink", hex: "#FFC9DE" },
    { name: "coral", hex: "#FFD8B1" },
    { name: "beige", hex: "#FFFAC8" },
    { name: "white", hex: "#FFFFFF" },
    { name: "black", hex: "#000000" }
];

// Used for client-side clarity
function timeProperty( app, obj, name, noInterpolate ) {

	const times = [];
	const values = [];

	let lastTime;
	let lastValue;

	Object.defineProperty( obj, name, {
		get: () => {

			if ( lastTime === app.time ) return lastValue;
			if ( times.length === 0 ) return undefined;

			let index = times.length - 1;

			while ( index > 0 && times[ index ] > app.time )
				index --;

			if ( ! noInterpolate && typeof values[ index ] === "function" )
				lastValue = values[ index ]( app.time );
			else
				lastValue = values[ index ];

			return lastValue;

		},
		set: value => {

			let index = times.length;

			while ( index > 0 && times[ index - 1 ] > app.time )
				index --;

			if ( index !== times.length && times[ index ] === app.time ) {

				if ( values[ index ] === value ) return;

				values[ index ] = value;
				lastTime = undefined;

			}

			times.splice( index, 0, app.time );
			values.splice( index, 0, value );

		}
	} );

}

var models = [];

// From http://www.mathopenref.com/coordpolygonarea2.html
function pointInPolygon( point, polygon ) {

	let inside = false;

    // Grab the first vertex, Loop through vertices
	for ( let i = 1, p = polygon[ 0 ]; i <= polygon.length; i ++ ) {

        //Grab the next vertex (to form a segment)
		const q = i === polygon.length ? polygon[ 0 ] : polygon[ i ];

        //Test if the point matches either vertex
		if ( q.y === point.y && ( q.x === point.x || p.y === point.y && q.x > point.x === p.x < point.x ) )
			return false;

        //Only consider segments whose (vertical) interval the point fits in
		if ( p.y < point.y !== q.y < point.y )

            //If one edge is to the right of us
			if ( p.x >= point.x )

                //And the other is as well (a wall)
				if ( q.x > point.x ) inside = ! inside;

				else {

                    //Otherwise calculate if we fall to left or right
					const d = ( p.x - point.x ) * ( q.y - point.y ) - ( q.x - point.x ) * ( p.y - point.y );

                    //We're on it (FLOAT POINT)
					if ( d >= - 1e-7 && d <= 1e-7 ) return false;

                    //We fall to the left
					else if ( d > 0 === q.y > p.y ) inside = ! inside;

				}

			else if ( q.x > point.x ) {

				const d = ( p.x - point.x ) * ( q.y - point.y ) - ( q.x - point.x ) * ( p.y - point.y );

				if ( d >= - 1e-7 && d <= 1e-7 ) return false;
				else if ( d > 0 === q.y > p.y ) inside = ! inside;

			}

		p = q;

	}

	return inside;

}

function pointInSomePolygon( point, polygons ) {

	for ( let i = 0; i < polygons.length; i ++ )
		if ( pointInPolygon( point, polygons ) ) return true;

	return false;

}

class Terrain {

	constructor( props ) {

		Object.assign( this, props );

	}

	// THis is meant to be optimized using a quadtree
	selectUnitsBoundedByRectangle( rect ) {

		let units = this.units || this.app && this.app.units;

		if ( ! units || ! units.length ) return [];

		return units.filter( unit => rect.contains( unit ) );

	}

	selectUnitsBoundedByPolygon( polygon ) {

		let units = this.units || this.app && this.app.units;

		if ( ! units || ! units.length ) return [];

		return units.filter( unit => pointInPolygon( unit, polygon ) );

	}

	selectUnitsBoundedByPolygons( polygons ) {

		let units = this.units || this.app && this.app.units;

		if ( ! units || ! units.length ) return [];

		return units.filter( unit => pointInSomePolygon( unit, polygons ) );

	}

}

class Doodad extends Handle {

	constructor( props ) {

		super( props );

		this.updates = [];

		this.shadowProps = {};

		if ( this.entityType === Doodad )
			Object.assign( this, { x: 0, y: 0 }, props );

		this._dirty = 0;

	}

	get key() {

		return "d" + this.id;

	}

	get model() {

		return this.shadowProps.model;

	}

	set model( model ) {

		this.shadowProps.model = model;

		if ( models[ model ].prototype instanceof THREE.Mesh ) {

			this.mesh = new models[ model ]( model );
			this.mesh.userData = this.id;

		} else models[ model ].addEventListener( "ready", ( { model: modelClass } ) => {

			this.mesh = new modelClass( model );

			this.mesh.userData = this.id;
			this.mesh.position.x = this.shadowProps.x || 0;
			this.mesh.position.y = this.shadowProps.y || 0;
			this.mesh.position.z = this.shadowProps.z || 0;

			if ( this.owner && this.mesh.accentFaces ) {

				for ( let i = 0; i < this.mesh.accentFaces.length; i ++ )
					this.mesh.geometry.faces[ this.mesh.accentFaces[ i ] ].color.set( this.owner.color.hex );

				this.mesh.geometry.colorsNeedUpdate = true;

			}

		} );

	}

	get mesh() {

		return this.shadowProps.mesh;

	}

	set mesh( mesh ) {

		if ( this.shadowProps.mesh instanceof THREE.Mesh )
			this.dispatchEvent( { type: "meshUnloaded" } );

		this.shadowProps.mesh = mesh;

		this.dispatchEvent( { type: "meshLoaded" } );

	}

	get x() {

		if ( typeof this.shadowProps.x === "function" )
			return this.shadowProps.x( this.app ? this.app.time : 0 );

		return this.shadowProps.x;

	}

	set x( x ) {

		// console.log( this.constructor.name, x );

		if ( typeof x === "function" && typeof this.shadowProps.x !== "function" ) ++ this.dirty;
		else if ( typeof x !== "function" ) {

			if ( this.mesh ) this.mesh.position.x = x;
			if ( typeof this.shadowProps.x === "function" )++ this.dirty;

		}

		this.shadowProps.x = x;

	}

	get y() {

		if ( typeof this.shadowProps.y === "function" )
			return this.shadowProps.y( this.app ? this.app.time : 0 );

		return this.shadowProps.y;

	}

	set y( y ) {

		if ( typeof y === "function" && typeof this.shadowProps.y !== "function" ) ++ this.dirty;
		else if ( typeof y !== "function" ) {

			if ( this.mesh ) this.mesh.position.y = y;
			if ( typeof this.shadowProps.y === "function" )++ this.dirty;

		}

		this.shadowProps.y = y;

	}

	get dirty() {

		return this._dirty;

	}

	set dirty( dirt ) {

		if ( isNaN( dirt ) ) dirt = 0;

		if ( ! this._dirty && dirt ) this.dispatchEvent( { type: "dirty" } );
		else if ( this._dirty && ! dirt ) this.dispatchEvent( { type: "clean" } );

		this._dirty = dirt;

	}

	toState() {

		return Object.assign( super.toState(), {
			x: this.shadowProps.x || this.x,
			y: this.shadowProps.y || this.y,
			facing: this.facing
		} );

	}

	render( time ) {

		if ( ! isBrowser || ! this.mesh ) return;

		if ( typeof this.shadowProps.x === "function" ) this.mesh.position.x = this.shadowProps.x( time );
		if ( typeof this.shadowProps.y === "function" ) this.mesh.position.y = this.shadowProps.y( time );

	}

	update( time ) {

		for ( let i = 0; i < this.updates.length; i ++ )
			this.updates[ i ]( time );

	}

}

class Unit extends Doodad {

	constructor( props ) {

		super( props );

		this.updates = [];

		this.shadowProps = {};

		if ( this.entityType === Unit )
			Object.assign( this, { x: 0, y: 0 }, props );

		this._dirty = 0;

	}

	get key() {

		return "u" + this.id;

	}

	set owner( owner ) {

		if ( this.shadowProps.owner === owner ) return;

		this.shadowProps.owner = owner;

		// Null and undefined
		if ( owner == undefined ) return;

		if ( this.mesh && this.mesh.accentFaces ) {

			for ( let i = 0; i < this.mesh.accentFaces.length; i ++ )
				this.mesh.geometry.faces[ this.mesh.accentFaces[ i ] ].color.set( owner.color.hex );

			this.mesh.geometry.colorsNeedUpdate = true;

		}

	}

	get owner() {

		return this.shadowProps.owner;

	}

	toState() {

		return Object.assign( super.toState(), {
			owner: this.owner
		} );

	}

}

let fetchFile;

if ( isBrowser ) {

	fetchFile = path => new Promise( ( resolve, reject ) => {

		const request = new XMLHttpRequest();

		request.ontimeout = err => reject( err );

		request.onload = () => {

			if ( request.readyState !== 4 ) return;

			if ( request.status >= 400 ) return reject( request );

			resolve( request.responseText );

		};

		request.open( "GET", path, true );
		request.timeout = 5000;
		request.send();

		return request.responseText;

	} );

} else {

	const fs = require( "fs" );

	fetchFile = path => new Promise( ( resolve, reject ) =>
        fs.readFile( path, "utf8", ( err, res ) => err ? reject( err ) : resolve( res ) ) );

}

var fetchFile$1 = fetchFile;

// A port of an algorithm by Johannes Baagøe <baagoe@baagoe.com>, 2010
// http://baagoe.com/en/RandomMusings/javascript/
// https://github.com/nquinlan/better-random-numbers-for-javascript-mirror
// Original work is under MIT license -

// Copyright (C) 2010 by Johannes Baagøe <baagoe@baagoe.org>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// Reformatted and swapped functions with lambdas, but otherwise the same

function Alea( seed ) {

	const me = this;
	const mash = Mash();

	me.next = () => {

		// console.log( "random" );

		const t = 2091639 * me.s0 + me.c * 2.3283064365386963e-10; // 2^-32
		me.s0 = me.s1;
		me.s1 = me.s2;

		return me.s2 = t - ( me.c = t | 0 );

	};

	// Apply the seeding algorithm from Baagoe.
	me.c = 1;
	me.s0 = mash( " " );
	me.s1 = mash( " " );
	me.s2 = mash( " " );

	me.s0 -= mash( seed );
	if ( me.s0 < 0 ) me.s0 += 1;

	me.s1 -= mash( seed );
	if ( me.s1 < 0 ) me.s1 += 1;

	me.s2 -= mash( seed );
	if ( me.s2 < 0 ) me.s2 += 1;

}

function copy( f, t ) {

	t.c = f.c;
	t.s0 = f.s0;
	t.s1 = f.s1;
	t.s2 = f.s2;

	return t;

}

function impl( seed, opts ) {

	const xg = new Alea( seed ),
		state = opts && opts.state,
		prng = xg.next;

	prng.int32 = () => ( xg.next() * 0x100000000 ) | 0;
	prng.double = () => prng() + ( prng() * 0x200000 | 0 ) * 1.1102230246251565e-16; // 2^-53;
	prng.quick = prng;

	if ( state ) {

		if ( typeof state === "object" ) copy( state, xg );

		prng.state = () => copy( xg, {} );

	}

	return prng;

}

function Mash() {

	let n = 0xefc8249d;

	const mash = ( data ) => {

		data = data.toString();
		for ( let i = 0; i < data.length; i ++ ) {

			n += data.charCodeAt( i );
			let h = 0.02519603282416938 * n;
			n = h >>> 0;
			h -= n;
			h *= n;
			n = h >>> 0;
			h -= n;
			n += h * 0x100000000; // 2^32

		}

		return ( n >>> 0 ) * 2.3283064365386963e-10; // 2^-32

	};

	return mash;

}

const reservedEventTypes = [ "playerJoin", "playerLeave", "sync", "state" ];

// Server
function clientJoinHandler( app, e ) {

	const player = new Player( Object.assign( { key: "p" + e.client.id }, e.client ) );
	const playerState = player.toState();

	const seed = app.initialSeed + player.id;
	app.random = new impl( seed );

	for ( let i = 0; i < app.players.length; i ++ )
		app.players[ i ].send( {
			type: "playerJoin",
			time: app.time,
			seed,
			player: playerState } );

	app.players.add( player );
	app.players.sort( ( a, b ) => a.id > b.id ? 1 : - 1 );

	// console.log( app.state );
	player.send( {
		type: "state",
		time: app.time,
		state: app.state,
		seed,
		local: player.toJSON()
	}, "toState" );

	app.dispatchEvent( { type: "playerJoin", player } );

}

// Server
function clientLeaveHandler( app, e ) {

	const player = app.players.dict[ "p" + e.client.id ];

	app.network.send( { type: "playerLeave", player } );
	app.dispatchEvent( { type: "playerLeave", player } );

}

// Server
// This modifies the actual event, replacing client with player
function clientMessageHandler( app, e ) {

	if ( ! e.client ) return;

	// Ignore unsafe messages
	if ( ! e.message.type || reservedEventTypes.indexOf( e.message.type ) !== - 1 ) return;

	// Update the game clock
	const now = Date.now();
	const delta = now - app.lastNow;
	app.lastNow = now;
	app.time += delta;

	// Set reserved values
	e.message.player = app.players.dict[ "p" + e.client.id ];
	e.message.time = app.time;

	app.network.send( e.message );
	app.dispatchEvent( e.message );

}

// Server + Local
function playerJoinHandler( app, e ) {

	// Don't do anything on the server
	if ( isServer ) return;

	if ( e.seed ) app.random = new impl( e.seed );

	if ( app.players.dict[ "p" + e.player.id ] ) return;

	new app.Player( Object.assign( { key: "p" + e.player.id }, e.player ) );

}

// Server + Local
function playerLeaveHandler( app, e ) {

	e.player.color.taken = false;

	app.players.remove( e.player );

}

function state( app, e ) {

	if ( e.local ) app.localPlayer = e.local;
	if ( e.seed ) app.random = new impl( e.seed );

	for ( const prop in e.state )
		if ( typeof e.state[ prop ] !== "object" )
			app.state[ prop ] = e.state[ prop ];

}




var rts = Object.freeze({
	clientJoinHandler: clientJoinHandler,
	clientLeaveHandler: clientLeaveHandler,
	clientMessageHandler: clientMessageHandler,
	playerJoinHandler: playerJoinHandler,
	reservedEventTypes: reservedEventTypes,
	playerLeaveHandler: playerLeaveHandler,
	state: state
});

// import EventDispatcher from "../../../../core/EventDispatcher";

class ClientNetwork extends EventDispatcher {

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

			// if ( isNaN( e.data ) ) console.log( JSON.parse( e.data ) );

			e = JSON.parse( e.data, this.reviver );

			if ( typeof e === "number" ) {

				this.app.time = e;
				this.app.officialTime = e;
				this.app.update();
				this.app.dispatchEvent( { type: "time", time: e }, true );

			} else if ( e instanceof Array ) {

				for ( let i = 0; i < e.length; i ++ ) {

					if ( this.app && e[ i ].time ) {

						this.app.time = e[ i ].time;
						this.app.officialTime = e[ i ].time;
						this.app.update();

					}

					this.app.dispatchEvent( e[ i ], true );

				}

			} else {

				if ( this.app && e.time ) {

					this.app.time = e.time;
					this.app.officialTime = e.time;
					this.app.update();

				}

				this.app.dispatchEvent( e, true );

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

// Adapated from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON#Polyfill

const toString = Object.prototype.toString;
const isArray = Array.isArray || ( a => toString.call( a ) === "[object Array]" );
const escMap = { "\"": "\\\"", "\\": "\\\\", "\b": "\\b", "\f": "\\f", "\n": "\\n", "\r": "\\r", "\t": "\\t" };
const escFunc = m => escMap[ m ] || "\\u" + ( m.charCodeAt( 0 ) + 0x10000 ).toString( 16 ).substr( 1 );
const escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;
const defaultReplacer = ( prop, value ) => value;

function stringify( value, replacer = defaultReplacer, toJSON = "toJSON" ) {

	if ( value == null ) return "null";
	if ( typeof value === "number" ) return replacer( undefined, isFinite( value ) ? value.toString() : "null" );
	if ( typeof value === "boolean" ) return replacer( undefined, value.toString() );
	if ( typeof value === "object" || typeof value === "function" ) {

		if ( typeof value[ toJSON ] === "function" ) return stringify( replacer( undefined, value[ toJSON ]() ), replacer, toJSON );
		if ( typeof value.toJSON === "function" ) return stringify( replacer( undefined, value.toJSON() ), replacer, toJSON );

		if ( typeof value === "function" ) return "\"" + value.toString().replace( escRE, escFunc ) + "\"";

		if ( isArray( value ) ) {

			let res = "[";

			for ( let i = 0; i < value.length; i ++ )
				res += ( i ? ", " : "" ) + stringify( replacer.call( value, i, value[ i ] ), replacer, toJSON );

			return res + "]";

		}

		const tmp = [];

		for ( const prop in value )
			if ( value.hasOwnProperty( prop ) )
				tmp.push( stringify( replacer.call( value, prop, prop ), replacer, toJSON ) + ": " + stringify( replacer.call( value, prop, value[ prop ] ), replacer, toJSON ) );

		return "{" + tmp.join( ", " ) + "}";

	}

	return "\"" + value.toString().replace( escRE, escFunc ) + "\"";

}

class ServerNetwork extends EventDispatcher {

	constructor( props = {} ) {

		super();

		this.clients = props.clients || new Collection();
		this.ws = props.ws && props.ws.constructor !== Object && props.ws || this.createWS( props );

		this.charsSent = 0;

		setInterval( () => {

			if ( ! this.charsSent ) return;
			// console.log( this.charsSent );
			this.charsSent = 0;

		}, 1000 );

	}

	send( data, toJSON ) {

		if ( typeof data === "object" ) {

			if ( this.app ) {

				if ( data instanceof Array ) {

					for ( let i = 0; i < data.length; i ++ )
						if ( data[ i ].time === undefined ) data[ i ].time = this.app.time;

				} else if ( data.time === undefined ) data.time = this.app.time;

			}

			if ( toJSON ) data = stringify( data, this.replacer, toJSON );
			else data = JSON.stringify( data, this.replacer );

		} else if ( typeof data !== "string" ) data = data.toString();

		// if ( this.clients.length )
		// 	console.log( "SEND", data );

		for ( let i = 0; i < this.clients.length; i ++ ) {

			try {

				this.clients[ i ].send( data );

			} catch ( err ) {}

			this.charsSent += data.length;

		}

	}

	createWS( props = {} ) {

		const ws$$1 = new Server( { port: props.port || 3000 } );
		console.log( "Listening on", props.port || 3000 );

		ws$$1.on( "connection", socket => {

			socket.id = ( Handle.id )++;
			socket.key = "c" + socket.id;
			this.clients.add( socket );
			console.log( "Connection from", socket._socket.remoteAddress, "on", socket._socket.remotePort, "as", socket.id );

			socket.onclose = () => {

				this.clients.remove( socket );

				this.app.dispatchEvent( { type: "clientLeave", client: { id: socket.id } } );

			};

			socket.onmessage = data => {

				// Ignore large messages
				if ( data.length > 1000 ) return;

				try {

					data = JSON.parse( data.data, this.reviver );

				} catch ( err ) {

					console.error( "Invalid message from client", socket.key );
					console.error( "May be a bug in the code or nefarious action" );

				}

				this.app.dispatchEvent( { type: "clientMessage", client: { id: socket.id }, message: data } );

			};

			this.app.dispatchEvent( { type: "clientJoin", client: { id: socket.id, send: ( data, toJSON ) => {

				if ( typeof data === "object" ) {

					if ( this.app ) {

						if ( data instanceof Array ) {

							for ( let i = 0; i < data.length; i ++ )
								if ( data[ i ].time === undefined ) data[ i ].time = this.app.time;

						} else if ( data.time === undefined ) data.time = this.app.time;

					}

					if ( toJSON ) data = stringify( data, this.replacer, toJSON );
					else data = JSON.stringify( data, this.replacer );

				}

				try {

					socket.send( data );

				} catch ( err ) {}

			} } } );

		} );

		return ws$$1;

	}

}

function renderer() {

	const renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	renderer.setSize( window.innerWidth, window.innerHeight );

	if ( document.readyState === "complete" || document.readyState === "loaded" || document.readyState === "interactive" )
		document.body.appendChild( renderer );

	else document.addEventListener( "DOMContentLoaded", () => document.body.appendChild( renderer.domElement ) );

	return renderer;

}

let rectId = 0;

class Rect extends EventDispatcher {

	constructor( p1, p2, x2, y2, props = {} ) {

		super();

		this.id = rectId ++;

		// Passed as x1, y1, x2, y2
		if ( typeof p1 === "nunber" ) {

			this.minX = Math.min( p1, x2 );
			this.maxX = Math.max( p1, x2 );
			this.minY = Math.min( p2, y2 );
			this.maxY = Math.max( p2, y2 );

		// Passed as {x1, y1}, {x2, y2}

		} else if ( p1.x !== undefined ) {

			this.minX = Math.min( p1.x, p2.x );
			this.maxX = Math.max( p1.x, p2.x );
			this.minY = Math.min( p1.y, p2.y );
			this.maxY = Math.max( p1.y, p2.y );

			if ( x2 !== undefined ) props = x2;

		// Not passed?

		} else {

			if ( p1 !== undefined ) props = p1;

		}

		if ( props.unitEnter ) this.addEventListener( "unitEnter", props.unitEnter );
		if ( props.unitLeave ) this.addEventListener( "unitLeave", props.unitLeave );

		Object.assign( this, { units: [] }, props );

	}

	get key() {

		return "r" + this.id;

	}

	addEventListener( type, ...args ) {

		if ( ( type === "unitEnter" || type === "unitLeave" ) && ( ! this._listeners.unitEnter || ! this._listeners.unitEnter.length ) && ( ! this._listeners.unitLeave || ! this._listeners.unitLeave.length ) )
			this.dispatchEvent( { type: "dirty" } );

		super.addEventListener( type, ...args );

	}

	// Returns true if a point-like object (with .x and .y) is contained by the rect
	contains( point ) {

		if ( point.x === undefined || point.y === undefined ) return;

		return point.x <= this.maxX && point.x >= this.minX && point.y <= this.maxY && point.y >= this.minY;

	}

	get area() {

		return ( this.maxX - this.minX ) * ( this.maxY - this.minY );

	}

	_diffOptimized( setA, setB, prop ) {

		const aUnique = [],
			bUnique = [],
			shared = [];

		for ( let i = 0, n = 0; i < setA.length && n < setB.length; ) {

			if ( setA[ i ][ prop ] < setB[ n ][ prop ] ) {

				aUnique.push( setA[ i ] );
				i ++;

			} else if ( setA[ i ][ prop ] > setB[ n ][ prop ] ) {

				bUnique.push( setB[ n ] );
				n ++;

			} else {

				shared.push( setA[ i ] );
				i ++; n ++;

			}

			if ( setA[ i ] === undefined && n < setB.length ) bUnique.push( ...setB.slice( n ) );
			if ( setB[ n ] === undefined && i < setA.length ) aUnique.push( ...setA.slice( i ) );

		}

		return [ aUnique, bUnique, shared ];

	}

	// Assumes ordered
	diff( setA, setB, compare ) {

		if ( setA.length === 0 ) return [[], setB.slice( 0 ), []];
		if ( setB.length === 0 ) return [ setA.slice( 0 ), [], []];

		if ( typeof compare !== "function" ) return this._diffOptimized( setA, setB, compare );

		const aUnique = [],
			bUnique = [],
			shared = [];

		for ( let i = 0, n = 0; i < setA.length || n < setB.length; ) {

			const relation = compare( setA[ i ], setB[ i ] );

			if ( relation < 0 ) {

				aUnique.push( setA[ i ] );
				i ++;

			} else if ( relation > 0 ) {

				bUnique.push( setB[ n ] );
				n ++;

			} else {

				shared.push( setA[ i ] );
				i ++; n ++;

			}

		}

		return [ aUnique, bUnique, shared ];

	}

	calculateEnter( obj ) {

		// Also, check when the shadowProps were defined (start)
		if ( obj.shadowProps === undefined || ( typeof obj.shadowProps.x !== "function" && typeof obj.shadowProps.y !== "function" ) )
			return NaN;

		if ( obj.shadowProps.x !== "function" ) {

			if ( obj.shadowProps.y.rate < 0 ) return obj.shadowProps.y.seek( this.maxY );
			return obj.shadowProps.y.seek( this.minY );

		} else if ( obj.shadowProps.y !== "function" ) {

			if ( obj.shadowProps.x.rate < 0 ) return obj.shadowProps.x.seek( this.maxX );
			return obj.shadowProps.x.seek( this.minX );

		}

		const xDelta = obj.shadowProps.x.rate < 0 ? Math.abs( obj.x - this.maxX ) : Math.abs( obj.x - this.minX ),
			yDelta = obj.shadowProps.y.rate < 0 ? Math.abs( obj.y - this.maxY ) : Math.abs( obj.y - this.minY );

		return xDelta < yDelta ?
			obj.shadowProps.x.seek( obj.shadowProps.x.rate < 0 ? this.maxX : this.minX ) :
			obj.shadowProps.y.seek( obj.shadowProps.y.rate < 0 ? this.maxY : this.minY );

	}

	calculateLeave( obj ) {

		// Also, check when the shadowProps were defined (start)
		if ( obj.shadowProps === undefined || ( typeof obj.shadowProps.x !== "function" && typeof obj.shadowProps.y !== "function" ) ) {

			if ( this.app ) return this.app.time;
			return NaN;

		}

		if ( typeof obj.shadowProps.x !== "function" ) {

			if ( obj.shadowProps.y.rate < 0 ) return obj.shadowProps.y.seek( this.minY );
			return obj.shadowProps.y.seek( this.maxY );

		} else if ( typeof obj.shadowProps.y !== "function" ) {

			if ( obj.shadowProps.x.rate < 0 ) return obj.shadowProps.x.seek( this.minX );
			return obj.shadowProps.x.seek( this.maxX );

		}

		const xDelta = obj.shadowProps.x.rate < 0 ? Math.abs( obj.x - this.minX ) : Math.abs( obj.x - this.maxX ),
			yDelta = obj.shadowProps.y.rate < 0 ? Math.abs( obj.y - this.minY ) : Math.abs( obj.y - this.maxY );

		return xDelta < yDelta ?
			obj.shadowProps.x.seek( obj.shadowProps.x.rate < 0 ? this.minX : this.maxX ) :
			obj.shadowProps.y.seek( obj.shadowProps.y.rate < 0 ? this.minY : this.maxY );

	}

	toJSON() {

		return {
			_key: this.key,
			_collection: "rects"
		};

	}

	update() {

		if ( ! this.area ) return;

		let units;

		if ( this.terrain ) units = this.terrain.selectUnitsBoundedByRectangle( this );
		else if ( this.app && this.app.terrain ) units = this.app.terrain.selectUnitsBoundedByRectangle( this );
		else if ( this.candidateUnits ) units = this.candidateUnits.filter( unit => this.contains( unit ) );
		else return console.error( "No source of units." );

		units.sort( ( a, b ) => a.id > b.id );

		const [ enters, leaves ] = this.diff( units, this.units, "id" );

		// console.log( this.units.length, units.length, enters.length, leaves.length, same.length );

		this.units = units;

		if ( enters.length === 0 && leaves.length === 0 ) return;

		// console.log( enters.reduce( ( col, u ) => ( col[ u.constructor.name ] ? ++ col[ u.constructor.name ] : col[ u.constructor.name ] = 1, col ), {} ),
		// 	leaves.reduce( ( col, u ) => ( col[ u.constructor.name ] ? ++ col[ u.constructor.name ] : col[ u.constructor.name ] = 1, col ), {} ) );

		const subevents = [];

		for ( let i = 0; i < enters.length; i ++ )
			subevents.push( { type: "unitEnter", unit: enters[ i ], time: this.calculateEnter( enters[ i ] ), target: this } );

		for ( let i = 0; i < leaves.length; i ++ )
			subevents.push( { type: "unitLeave", unit: leaves[ i ], time: this.calculateLeave( leaves[ i ] ), target: this } );

		if ( this.app ) return this.app.subevents.push( ...subevents );

		subevents.sort( ( a, b ) => a.time - b.time );

		for ( let i = 0; i < subevents.length; i ++ )
			this.dispatchEvent( subevents[ i ] );

	}

}

const stringify$2 = value => value === Infinity ? "__Infinity" : value === - Infinity ? "__-Infinity" : value;
const parse = value => value === "__Infinity" ? Infinity : value === "__-Infinity" ? - Infinity : value;

function linearTween( { start = 0, end = 1, rate, duration, startTime = Date.now() } = {} ) {

	// console.log( "linearTween" );

	if ( typeof duration === "string" ) duration = parse( duration );

	const diff = end - start;

	if ( rate === undefined ) {

		if ( duration === Infinity ) rate = 1;
		else rate = diff / duration;

	}

	if ( duration === undefined ) duration = diff / rate;

	const func = ( time = Date.now() ) => {

		const delta = ( time - startTime ) / 1000;

		if ( delta >= duration ) return end;

		return start + delta * rate;

	};

	Object.assign( func, {
		start, end, rate, duration, startTime, diff,
		seek: value => ( value - start ) / rate * 1000 + startTime,
		toState: () => ( { _function: "linearTween", start, end, rate, duration: stringify$2( duration ), startTime } )
	} );

	return func;

}



var tweens = Object.freeze({
	linearTween: linearTween
});

// Actually used by App

const eval2 = eval;

class App extends EventDispatcher {

	constructor( props = {} ) {

		super();

		this.state = {};

		// Time keeping
		this.time = 0;
		this.renderTime = 0;
		this.lastNow = Date.now();
		this.lastRender = this.lastNow;

		// Randomness
		this.initialSeed = props.seed || "webcraft";
		timeProperty( this, this, "random", true );
		this.random = new impl( this.initialSeed );

		// Collections & Arrays
		this.handles = props.handles || new Collection();
		this.players = props.players || new Collection();
		this.units = props.units || new Collection();
		this.doodads = props.doodads || new Collection();
		this.rects = props.rects || new Collection();
		this.updates = props.updates || new Collection();
		this.renders = props.renders || new Collection();
		this.subevents = props.subevents || [];

		if ( isServer ) Object.defineProperty( this, "officialTime", { get: () => this.time } );

		// Initialize the app components
		this.initTerrain( props.terrain );
		this.initScene( props.scene );
		this.eventSystem = Object.assign( {}, rts, props.eventSystem );
		this.initFactories( props.types );
		this.initNetwork( props.network );

		// Initialze the app browser components (graphics, ui, intents)
		if ( isBrowser ) this.initBrowserComponents( props );

		// Start our primary loop
		if ( isServer ) this.update();
		if ( isBrowser ) this.render();

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

	initBrowserComponents( props ) {

		this.intentSystem = Object.assign( {}, props.intentSystem );

		this.initCamera( props.camera );
		this.renderer = props.renderer && props.renderer.constructor !== Object ? props.renderer : renderer( props.renderer );

		window.addEventListener( "resize", () => this.camera.resize() );
		window.addEventListener( "keydown", e => this.intentSystem.keydown && this.intentSystem.keydown( e ) );
		window.addEventListener( "keyup", e => this.intentSystem.keyup && this.intentSystem.keyup( e ) );

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

	initNetwork( props = {} ) {

		if ( props.reviver === undefined )
			props.reviver = ( key, value ) => {

				// if ( key || typeof value !== "number" )
				// 	console.log( "reviver", key, value );

				// Primitive
				if ( value == null || typeof value !== "object" ) return value;

				if ( value._collection !== undefined && value._key !== undefined ) {

					// Try fetching from collection
					let obj = this[ value._collection ].dict[ value._key ];

					// Create it if recongized constructor
					if ( ! obj && value._constructor )
						obj = new this[ value._constructor ]( { key: value._key } );

					// Expand out properties
					for ( const prop in value )
						if ( [ "_key", "_collection", "_constructor", "_function" ].indexOf( prop ) === - 1 )
							value[ prop ] = props.reviver( prop, value[ prop ] );

					// Apply properties
					if ( obj )
						for ( const prop in value )
							if ( [ "_key", "_collection", "_constructor", "_function" ].indexOf( "prop" ) === - 1 )
								obj[ prop ] = value[ prop ];

					return obj;

				}

				// Not collectable, but still a constructable
				if ( value._constructor ) {

					const obj = new this[ value._constructor ]( { key: value._key } );

					for ( const prop in value )
						if ( [ "_key", "_collection", "_constructor", "_function" ].indexOf( prop ) === - 1 )
							value[ prop ] = props.reviver( prop, value[ prop ] );

					if ( obj )
						for ( const prop in value )
							if ( [ "_key", "_collection", "_constructor", "_function" ].indexOf( "prop" ) === - 1 )
								obj[ prop ] = value[ prop ];

					return obj;

				}

				// A function without applied properties
				if ( value._function ) return this[ value._function ]( value );

				return value;

			};

		if ( isServer ) this.initServerNetwork( props );
		else this.initClientNetwork( props );

		this.addEventListener( "playerJoin", e => this.eventSystem.playerJoinHandler( this, e ) );
		this.addEventListener( "playerLeave", e => this.eventSystem.playerLeaveHandler( this, e ) );
		this.addEventListener( "state", e => this.eventSystem.state( this, e ) );

	}

	initServerNetwork( props = {} ) {

		this.network = props.constructor !== Object ?
			props :
			new ServerNetwork( Object.assign( { players: this.players }, props ) );

		this.addEventListener( "clientJoin", e => this.eventSystem.clientJoinHandler( this, e ) );
		this.addEventListener( "clientLeave", e => this.eventSystem.clientLeaveHandler( this, e ) );
		this.addEventListener( "clientMessage", e => this.eventSystem.clientMessageHandler( this, e ) );

		this.network.app = this;

	}

	initClientNetwork( props = {} ) {

		this.network = props && props.constructor !== Object ?
			props :
			new ClientNetwork( props );

		this.network.app = this;

	}

	initFactories( types ) {

		const app = this;

		this.Player = class extends Player {

			constructor( props ) {

				super( Object.assign( { app }, props ) );

				app.players.add( this );
				app.players.sort( ( a, b ) => a.id > b.id ? 1 : - 1 );

			}

		};

		for ( const tween in tweens )
			this[ tween ] = obj => tweens[ tween ]( Object.assign( { startTime: this.time }, obj ) );

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

	loadUnitType( type ) {

		const app = this;

		if ( models[ type.model ] === undefined ) {

			models[ type.model ] = new EventDispatcher();
			fetchFile$1( type.model )
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

	loadDoodadType( type ) {

		const app = this;

		if ( models[ type.model ] === undefined ) {

			models[ type.model ] = new EventDispatcher();
			fetchFile$1( type.model )
				.then( file => {

					const eventDispatcher = models[ type.model ];

					models[ type.model ] = eval2( file );

					eventDispatcher.dispatchEvent( { type: "ready", model: models[ type.model ] } );

				} )
				.catch( err => console.error( err ) );

		}

		this[ type.name ] = class extends Doodad {

			constructor( props ) {

				super( Object.assign( { app }, type, props ) );

				app.doodads.add( this );

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

	setTimeout( callback, time = 0, absolute = false ) {

		const subevent = { time: absolute ? time : this.time + time, callback, clear: () => {

			const index = this.subevents.indexOf( subevent );
			if ( index >= 0 ) this.subevents.splice( index, 1 );

		} };

		this.subevents.push( subevent );

		return subevent;

	}

	setInterval( callback, time = 1 ) {

		const wrappedCallback = time => {

			callback( time );
			subevent.time = this.time + time;
			this.subevents.push( subevent );

		};

		const subevent = { time: this.time + time, callback: wrappedCallback, clear: () => {

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

	update() {

		if ( isServer ) {

			const now = Date.now();
			const delta = now - this.lastNow;

			this.lastNow = now;
			this.time += delta;

		} else if ( isBrowser ) this.renderTime = this.time;

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

		if ( isServer ) this.network.send( this.time );
		setTimeout( () => this.update(), 25 );

	}

}

export { App, EventDispatcher, Unit, Rect, linearTween, isBrowser, isClient, isServer };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViY3JhZnQubW9kdWxlLmpzIiwic291cmNlcyI6WyIuLi9zcmMvY29yZS9Db2xsZWN0aW9uLmpzIiwiLi4vc3JjL21pc2MvZW52LmpzIiwiLi4vc3JjL2NvcmUvRXZlbnREaXNwYXRjaGVyLmpzIiwiLi4vc3JjL2NvcmUvSGFuZGxlLmpzIiwiLi4vc3JjL2NvcmUvUGxheWVyLmpzIiwiLi4vc3JjL2NvcmUvdGltZVByb3BlcnR5LmpzIiwiLi4vc3JjL2VudGl0aWVzL21vZGVscy5qcyIsIi4uL3NyYy9tYXRoL2dlb21ldHJ5LmpzIiwiLi4vc3JjL2VudGl0aWVzL1RlcnJhaW4uanMiLCIuLi9zcmMvZW50aXRpZXMvRG9vZGFkLmpzIiwiLi4vc3JjL2VudGl0aWVzL1VuaXQuanMiLCIuLi9zcmMvbWlzYy9mZXRjaEZpbGUuanMiLCIuLi9saWIvc2VlZHJhbmRvbS1hbGVhLmpzIiwiLi4vc3JjL3ByZXNldHMvZXZlbnRzL3J0cy5qcyIsIi4uL3NyYy9wcmVzZXRzL25ldHdvcmtzL2NsaWVudHMvcnRzLmpzIiwiLi4vc3JjL21pc2Mvc3RyaW5naWZ5LmpzIiwiLi4vc3JjL3ByZXNldHMvbmV0d29ya3Mvc2VydmVycy9ydHMuanMiLCIuLi9zcmMvcHJlc2V0cy9taXNjL3JlbmRlcmVyLmpzIiwiLi4vc3JjL21pc2MvUmVjdC5qcyIsIi4uL3NyYy90d2VlbnMvbGluZWFyVHdlZW4uanMiLCIuLi9zcmMvY29yZS9BcHAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiXG5jbGFzcyBDb2xsZWN0aW9uIGV4dGVuZHMgQXJyYXkge1xuXG5cdGNvbnN0cnVjdG9yKCAuLi5hcmdzICkge1xuXG5cdFx0c3VwZXIoIC4uLmFyZ3MgKTtcblxuXHRcdHRoaXMua2V5ID0gQ29sbGVjdGlvbi5kZWZhdWx0S2V5O1xuXHRcdHRoaXMuZGljdCA9IHt9O1xuXG5cdH1cblxuXHRhZGQoIC4uLml0ZW1zICkge1xuXG5cdFx0dGhpcy5wdXNoKCAuLi5pdGVtcyApO1xuXG5cdFx0Zm9yICggbGV0IGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpICsrIClcblx0XHRcdGlmICggaXRlbXNbIGkgXVsgdGhpcy5rZXkgXSAhPT0gdW5kZWZpbmVkIClcblx0XHRcdFx0dGhpcy5kaWN0WyBpdGVtc1sgaSBdWyB0aGlzLmtleSBdIF0gPSBpdGVtc1sgaSBdO1xuXG5cdH1cblxuXHRyZXBsYWNlKCBhcnIgKSB7XG5cblx0XHR0aGlzLnNwbGljZSggMCApO1xuXHRcdHRoaXMuZGljdCA9IHt9O1xuXG5cdFx0dGhpcy5hZGQoIC4uLmFyciApO1xuXG5cdH1cblxuXHRyZW1vdmUoIGl0ZW0gKSB7XG5cblx0XHRjb25zdCBpbmRleCA9IHRoaXMuaW5kZXhPZiggaXRlbSApO1xuXHRcdGlmICggaW5kZXggPj0gMCApIHRoaXMuc3BsaWNlKCBpbmRleCwgMSApO1xuXG5cdFx0Ly9JcyB0aGUgc2Vjb25kIGNvbmRpdGlvbiByZXF1aXJlZD8gSG93IGRvZXMgaXQgZWZmZWN0IHNwZWVkP1xuXHRcdGlmICggaXRlbVsgdGhpcy5rZXkgXSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZGljdFsgaXRlbVsgdGhpcy5rZXkgXSBdIClcblx0XHRcdGRlbGV0ZSB0aGlzLmRpY3RbIGl0ZW1bIHRoaXMua2V5IF0gXTtcblxuXHR9XG5cbn1cblxuQ29sbGVjdGlvbi5kZWZhdWx0S2V5ID0gXCJrZXlcIjtcblxuZXhwb3J0IGRlZmF1bHQgQ29sbGVjdGlvbjtcbiIsIlxuZXhwb3J0IGNvbnN0IGlzQnJvd3NlciA9IG5ldyBGdW5jdGlvbiggXCJ0cnkge3JldHVybiB0aGlzPT09d2luZG93O31jYXRjaChlKXsgcmV0dXJuIGZhbHNlO31cIiApKCk7XG5leHBvcnQgY29uc3QgaXNDbGllbnQgPSBuZXcgRnVuY3Rpb24oIFwidHJ5IHtyZXR1cm4gdGhpcz09PXdpbmRvdzt9Y2F0Y2goZSl7IHJldHVybiBmYWxzZTt9XCIgKSgpO1xuZXhwb3J0IGNvbnN0IGlzU2VydmVyID0gISBuZXcgRnVuY3Rpb24oIFwidHJ5IHtyZXR1cm4gdGhpcz09PXdpbmRvdzt9Y2F0Y2goZSl7IHJldHVybiBmYWxzZTt9XCIgKSgpO1xuIiwiXG4vLyBBZGFwdGVkIGZyb20gVEhSRUUuanNcblxuaW1wb3J0ICogYXMgZW52IGZyb20gXCIuLi9taXNjL2Vudi5qc1wiO1xuXG5jbGFzcyBFdmVudERpc3BhdGNoZXIge1xuXG5cdGdldCBfbGlzdGVuZXJDb3VudCgpIHtcblxuXHRcdGxldCBjb3VudCA9IDA7XG5cblx0XHRmb3IgKCBjb25zdCBwcm9wIGluIHRoaXMuX2xpc3RlbmVycyApXG5cdFx0XHRjb3VudCArPSB0aGlzLl9saXN0ZW5lcnNbIHByb3AgXS5sZW5ndGg7XG5cblx0XHRyZXR1cm4gY291bnQ7XG5cblx0fVxuXG5cdGFkZEV2ZW50TGlzdGVuZXIoIHR5cGVzLCBsaXN0ZW5lciApIHtcblxuXHRcdGlmICggdHlwZXMuaW5kZXhPZiggXCIgXCIgKSAhPT0gLSAxICkgdHlwZXMuc3BsaXQoIFwiIFwiICkubWFwKCB0eXBlID0+IHRoaXMuYWRkRXZlbnRMaXN0ZW5lciggdHlwZSwgbGlzdGVuZXIgKSApO1xuXG5cdFx0aWYgKCB0aGlzLl9saXN0ZW5lcnMgPT09IHVuZGVmaW5lZCApIHRoaXMuX2xpc3RlbmVycyA9IHt9O1xuXG5cdFx0aWYgKCB0aGlzLl9saXN0ZW5lcnNbIHR5cGVzIF0gPT09IHVuZGVmaW5lZCApXG5cdFx0XHR0aGlzLl9saXN0ZW5lcnNbIHR5cGVzIF0gPSBbXTtcblxuXHRcdGlmICggdGhpcy5fbGlzdGVuZXJzWyB0eXBlcyBdLmluZGV4T2YoIGxpc3RlbmVyICkgPT09IC0gMSApXG5cdFx0XHR0aGlzLl9saXN0ZW5lcnNbIHR5cGVzIF0ucHVzaCggbGlzdGVuZXIgKTtcblxuXHR9XG5cblx0aGFzRXZlbnRMaXN0ZW5lciggdHlwZSwgbGlzdGVuZXIgKSB7XG5cblx0XHRpZiAoIHRoaXMuX2xpc3RlbmVycyA9PT0gdW5kZWZpbmVkICkgcmV0dXJuO1xuXG5cdFx0cmV0dXJuIHRoaXMuX2xpc3RlbmVyc1sgdHlwZSBdICE9PSB1bmRlZmluZWQgJiYgdGhpcy5fbGlzdGVuZXJzWyB0eXBlIF0uaW5kZXhPZiggbGlzdGVuZXIgKSAhPT0gLSAxO1xuXG5cdH1cblxuXHRyZW1vdmVFdmVudExpc3RlbmVyKCB0eXBlLCBsaXN0ZW5lciApIHtcblxuXHRcdGlmICggdGhpcy5fbGlzdGVuZXJzID09PSB1bmRlZmluZWQgKSByZXR1cm47XG5cblx0XHRpZiAoIHRoaXMuX2xpc3RlbmVyc1sgdHlwZSBdID09PSB1bmRlZmluZWQgKSByZXR1cm47XG5cblx0XHRjb25zdCBpbmRleCA9IHRoaXMuX2xpc3RlbmVyc1sgdHlwZSBdLmluZGV4T2YoIGxpc3RlbmVyICk7XG5cdFx0aWYgKCBpbmRleCAhPT0gLSAxICkgdGhpcy5fbGlzdGVuZXJzWyB0eXBlIF0uc3BsaWNlKCBpbmRleCwgMSApO1xuXG5cdH1cblxuXHRkaXNwYXRjaEV2ZW50KCBldmVudCwgcmVjZWl2ZWQgKSB7XG5cblx0XHRpZiAoIHRoaXMuX2xpc3RlbmVycyA9PT0gdW5kZWZpbmVkICkgcmV0dXJuO1xuXG5cdFx0Y29uc3QgYXJyID0gdGhpcy5fbGlzdGVuZXJzWyBldmVudC50eXBlIF07XG5cdFx0aWYgKCBhcnIgPT09IHVuZGVmaW5lZCB8fCBhcnIubGVuZ3RoID09PSAwICkgcmV0dXJuO1xuXG5cdFx0aWYgKCBlbnYuaXNDbGllbnQgJiYgISByZWNlaXZlZCApXG5cdFx0XHRldmVudC50eXBlID0gZXZlbnQudHlwZSArIFwiUHJlZGljdGlvblwiO1xuXG5cdFx0Y29uc3QgY2xvbmUgPSBhcnIuc2xpY2UoIDAgKTtcblxuXHRcdGZvciAoIGxldCBpID0gMDsgaSA8IGNsb25lLmxlbmd0aDsgaSArKyApXG5cdFx0XHR0cnkge1xuXG5cdFx0XHRcdGNsb25lWyBpIF0uY2FsbCggdGhpcywgZXZlbnQgKTtcblxuXHRcdFx0fSBjYXRjaCAoIGVyciApIHtcblxuXHRcdFx0XHQvLyBSZXBvcnQgdXNlciBlcnJvcnMgYnV0IGNvbnRpbnVlIG9uXG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoIGVyciApO1xuXG5cdFx0XHR9XG5cblx0fVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IEV2ZW50RGlzcGF0Y2hlcjtcbiIsIlxuaW1wb3J0IEV2ZW50RGlzcGF0Y2hlciBmcm9tIFwiLi9FdmVudERpc3BhdGNoZXIuanNcIjtcblxuY2xhc3MgSGFuZGxlIGV4dGVuZHMgRXZlbnREaXNwYXRjaGVyIHtcblxuXHRjb25zdHJ1Y3RvciggcHJvcHMgKSB7XG5cblx0XHRzdXBlcigpO1xuXG5cdFx0aWYgKCBwcm9wcy5pZCA9PT0gdW5kZWZpbmVkIClcblx0XHRcdHRoaXMuaWQgPSAoIEhhbmRsZS5pZCApICsrO1xuXG5cdH1cblxuXHRnZXQga2V5KCkge1xuXG5cdFx0cmV0dXJuIFwiaFwiICsgdGhpcy5pZDtcblxuXHR9XG5cblx0c2V0IGtleSggdmFsdWUgKSB7XG5cblx0XHR0aGlzLmlkID0gdmFsdWUuc2xpY2UoIDEgKTtcblxuXHR9XG5cblx0Z2V0IGVudGl0eVR5cGUoKSB7XG5cblx0XHRsZXQgcHJvdG8gPSB0aGlzO1xuXG5cdFx0d2hpbGUgKCBwcm90byAmJiBIYW5kbGUuZW50aXR5VHlwZXMuaW5kZXhPZiggcHJvdG8uY29uc3RydWN0b3IubmFtZSApID09PSAtIDEgKVxuXHRcdFx0cHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoIHByb3RvICk7XG5cblx0XHRpZiAoICEgcHJvdG8gKSByZXR1cm47XG5cblx0XHRyZXR1cm4gcHJvdG8uY29uc3RydWN0b3I7XG5cblx0fVxuXG5cdHRvU3RhdGUoKSB7XG5cblx0XHRyZXR1cm4gT2JqZWN0LmFzc2lnbigge1xuXHRcdFx0X2tleTogdGhpcy5rZXksXG5cdFx0XHRfY29sbGVjdGlvbjogdGhpcy5lbnRpdHlUeXBlLm5hbWUudG9Mb3dlckNhc2UoKSArIFwic1wiLFxuXHRcdFx0X2NvbnN0cnVjdG9yOiB0aGlzLmNvbnN0cnVjdG9yLm5hbWVcblx0XHR9ICk7XG5cblx0fVxuXG5cdHRvSlNPTigpIHtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRfa2V5OiB0aGlzLmtleSxcblx0XHRcdF9jb2xsZWN0aW9uOiB0aGlzLmVudGl0eVR5cGUubmFtZS50b0xvd2VyQ2FzZSgpICsgXCJzXCJcblx0XHR9O1xuXG5cdH1cblxufVxuXG5IYW5kbGUuZW50aXR5VHlwZXMgPSBbIFwiRG9vZGFkXCIsIFwiVW5pdFwiLCBcIlBsYXllclwiLCBcIlJlY3RcIiBdO1xuSGFuZGxlLmlkID0gMDtcblxuZXhwb3J0IGRlZmF1bHQgSGFuZGxlO1xuIiwiXG5pbXBvcnQgSGFuZGxlIGZyb20gXCIuL0hhbmRsZS5qc1wiO1xuXG5jbGFzcyBQbGF5ZXIgZXh0ZW5kcyBIYW5kbGUge1xuXG5cdGNvbnN0cnVjdG9yKCBwcm9wcyA9IHt9ICkge1xuXG5cdFx0c3VwZXIoIHByb3BzICk7XG5cblx0XHR0aGlzLnNoYWRvd1Byb3BzID0ge307XG5cblx0XHRpZiAoIHRoaXMuZW50aXR5VHlwZSA9PT0gUGxheWVyIClcblx0XHRcdE9iamVjdC5hc3NpZ24oIHRoaXMsIHsgY29sb3I6IFBsYXllci5nZXROZXh0Q29sb3IoKSB9LCBwcm9wcyApO1xuXG5cdH1cblxuXHRzdGF0aWMgZ2V0TmV4dENvbG9yKCkge1xuXG5cdFx0bGV0IGkgPSAwO1xuXHRcdHdoaWxlICggaSA8IFBsYXllci5jb2xvcnMubGVuZ3RoICYmIFBsYXllci5jb2xvcnNbIGkgXS50YWtlbiApXG5cdFx0XHRpICsrO1xuXG5cdFx0aWYgKCBpID09PSBQbGF5ZXIuY29sb3JzLmxlbmd0aCApXG5cdFx0XHRjb25zb2xlLmVycm9yKCBcIlRoaXMgaXMgYXdrd2FyZFwiICk7XG5cblx0XHRyZXR1cm4gaTtcblxuXHR9XG5cblx0Z2V0IGtleSgpIHtcblxuXHRcdHJldHVybiBcInBcIiArIHRoaXMuaWQ7XG5cblx0fVxuXG5cdHNldCBrZXkoIGtleSApIHtcblxuXHRcdHRoaXMuaWQgPSBwYXJzZUludCgga2V5LnNsaWNlKCAxICkgKTtcblxuXHR9XG5cblx0Z2V0IGNvbG9yKCkge1xuXG5cdFx0cmV0dXJuIHRoaXMuc2hhZG93UHJvcHMuY29sb3I7XG5cblx0fVxuXG5cdHNldCBjb2xvciggY29sb3IgKSB7XG5cblx0XHRpZiAoIHR5cGVvZiBjb2xvciA9PT0gXCJudW1iZXJcIiApIGNvbG9yID0gUGxheWVyLmNvbG9yc1sgY29sb3IgXTtcblx0XHRlbHNlIGlmICggdHlwZW9mIGNvbG9yID09PSBcInN0cmluZ1wiICkgY29sb3IgPSBQbGF5ZXIuY29sb3JzLmZpbmQoIGMgPT4gYy5uYW1lID09PSBjb2xvciB8fCBjLmhleCA9PT0gY29sb3IgKTtcblx0XHRlbHNlIHJldHVybjtcblxuXHRcdGlmICggISBjb2xvciApIHJldHVybjtcblxuXHRcdGlmICggdGhpcy5zaGFkb3dQcm9wcy5jb2xvciApIHRoaXMuc2hhZG93UHJvcHMuY29sb3IudGFrZW4gPSBmYWxzZTtcblxuXHRcdHRoaXMuc2hhZG93UHJvcHMuY29sb3IgPSBjb2xvcjtcblx0XHR0aGlzLnNoYWRvd1Byb3BzLmNvbG9yLnRha2VuID0gdHJ1ZTtcblxuXHR9XG5cblx0ZGVzdHJveSgpIHtcblxuXHRcdHRoaXMuY29sb3IudGFrZW4gPSBmYWxzZTtcblxuXHR9XG5cblx0dG9TdGF0ZSgpIHtcblxuXHRcdHJldHVybiBPYmplY3QuYXNzaWduKCB0aGlzLnRvSlNPTigpLCB7XG5cdFx0XHRfY29uc3RydWN0b3I6IHRoaXMuY29uc3RydWN0b3IubmFtZSxcblx0XHRcdGNvbG9yOiBQbGF5ZXIuY29sb3JzLmluZGV4T2YoIHRoaXMuY29sb3IgKVxuXHRcdH0gKTtcblxuXHR9XG5cblx0dG9KU09OKCkge1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdF9rZXk6IHRoaXMua2V5LFxuXHRcdFx0X2NvbGxlY3Rpb246IFwicGxheWVyc1wiXG5cdFx0fTtcblxuXHR9XG5cbn1cblxuUGxheWVyLmNvbG9ycyA9IFtcbiAgICB7IG5hbWU6IFwicmVkXCIsIGhleDogXCIjRkYwMDAwXCIgfSxcbiAgICB7IG5hbWU6IFwiYmx1ZVwiLCBoZXg6IFwiIzQzODVGRlwiIH0sXG4gICAgeyBuYW1lOiBcImN5YW5cIiwgaGV4OiBcIiM2NEZGRkZcIiB9LFxuICAgIHsgbmFtZTogXCJwdXJwbGVcIiwgaGV4OiBcIiM4MjAwOTZcIiB9LFxuICAgIHsgbmFtZTogXCJ5ZWxsb3dcIiwgaGV4OiBcIiNGRkVBMDBcIiB9LFxuICAgIHsgbmFtZTogXCJvcmFuZ2VcIiwgaGV4OiBcIiNGRjk5MDBcIiB9LFxuICAgIHsgbmFtZTogXCJsaW1lXCIsIGhleDogXCIjQkVGRjAwXCIgfSxcbiAgICB7IG5hbWU6IFwibWFnZW50YVwiLCBoZXg6IFwiI0ZGMDBGRlwiIH0sXG4gICAgeyBuYW1lOiBcImdyZXlcIiwgaGV4OiBcIiM4MDgwODBcIiB9LFxuICAgIHsgbmFtZTogXCJtaW50XCIsIGhleDogXCIjQUFGRkMzXCIgfSxcbiAgICB7IG5hbWU6IFwiZ3JlZW5cIiwgaGV4OiBcIiMwMEJFMDBcIiB9LFxuICAgIHsgbmFtZTogXCJicm93blwiLCBoZXg6IFwiI0FBNkUyOFwiIH0sXG4gICAgeyBuYW1lOiBcIm1hcm9vblwiLCBoZXg6IFwiIzgwMDAwMFwiIH0sXG4gICAgeyBuYW1lOiBcIm5hdnlcIiwgaGV4OiBcIiMwMDAwODBcIiB9LFxuICAgIHsgbmFtZTogXCJvbGl2ZVwiLCBoZXg6IFwiIzgwODAwMFwiIH0sXG4gICAgeyBuYW1lOiBcInRlYWxcIiwgaGV4OiBcIiMwMDgwODBcIiB9LFxuICAgIHsgbmFtZTogXCJsYXZlbmRlclwiLCBoZXg6IFwiI0U2QkVGRlwiIH0sXG4gICAgeyBuYW1lOiBcInBpbmtcIiwgaGV4OiBcIiNGRkM5REVcIiB9LFxuICAgIHsgbmFtZTogXCJjb3JhbFwiLCBoZXg6IFwiI0ZGRDhCMVwiIH0sXG4gICAgeyBuYW1lOiBcImJlaWdlXCIsIGhleDogXCIjRkZGQUM4XCIgfSxcbiAgICB7IG5hbWU6IFwid2hpdGVcIiwgaGV4OiBcIiNGRkZGRkZcIiB9LFxuICAgIHsgbmFtZTogXCJibGFja1wiLCBoZXg6IFwiIzAwMDAwMFwiIH1cbl07XG5cbmV4cG9ydCBkZWZhdWx0IFBsYXllcjtcbiIsIlxuLy8gVXNlZCBmb3IgY2xpZW50LXNpZGUgY2xhcml0eVxuZnVuY3Rpb24gdGltZVByb3BlcnR5KCBhcHAsIG9iaiwgbmFtZSwgbm9JbnRlcnBvbGF0ZSApIHtcblxuXHRjb25zdCB0aW1lcyA9IFtdO1xuXHRjb25zdCB2YWx1ZXMgPSBbXTtcblxuXHRsZXQgbGFzdFRpbWU7XG5cdGxldCBsYXN0VmFsdWU7XG5cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KCBvYmosIG5hbWUsIHtcblx0XHRnZXQ6ICgpID0+IHtcblxuXHRcdFx0aWYgKCBsYXN0VGltZSA9PT0gYXBwLnRpbWUgKSByZXR1cm4gbGFzdFZhbHVlO1xuXHRcdFx0aWYgKCB0aW1lcy5sZW5ndGggPT09IDAgKSByZXR1cm4gdW5kZWZpbmVkO1xuXG5cdFx0XHRsZXQgaW5kZXggPSB0aW1lcy5sZW5ndGggLSAxO1xuXG5cdFx0XHR3aGlsZSAoIGluZGV4ID4gMCAmJiB0aW1lc1sgaW5kZXggXSA+IGFwcC50aW1lIClcblx0XHRcdFx0aW5kZXggLS07XG5cblx0XHRcdGlmICggISBub0ludGVycG9sYXRlICYmIHR5cGVvZiB2YWx1ZXNbIGluZGV4IF0gPT09IFwiZnVuY3Rpb25cIiApXG5cdFx0XHRcdGxhc3RWYWx1ZSA9IHZhbHVlc1sgaW5kZXggXSggYXBwLnRpbWUgKTtcblx0XHRcdGVsc2Vcblx0XHRcdFx0bGFzdFZhbHVlID0gdmFsdWVzWyBpbmRleCBdO1xuXG5cdFx0XHRyZXR1cm4gbGFzdFZhbHVlO1xuXG5cdFx0fSxcblx0XHRzZXQ6IHZhbHVlID0+IHtcblxuXHRcdFx0bGV0IGluZGV4ID0gdGltZXMubGVuZ3RoO1xuXG5cdFx0XHR3aGlsZSAoIGluZGV4ID4gMCAmJiB0aW1lc1sgaW5kZXggLSAxIF0gPiBhcHAudGltZSApXG5cdFx0XHRcdGluZGV4IC0tO1xuXG5cdFx0XHRpZiAoIGluZGV4ICE9PSB0aW1lcy5sZW5ndGggJiYgdGltZXNbIGluZGV4IF0gPT09IGFwcC50aW1lICkge1xuXG5cdFx0XHRcdGlmICggdmFsdWVzWyBpbmRleCBdID09PSB2YWx1ZSApIHJldHVybjtcblxuXHRcdFx0XHR2YWx1ZXNbIGluZGV4IF0gPSB2YWx1ZTtcblx0XHRcdFx0bGFzdFRpbWUgPSB1bmRlZmluZWQ7XG5cblx0XHRcdH1cblxuXHRcdFx0dGltZXMuc3BsaWNlKCBpbmRleCwgMCwgYXBwLnRpbWUgKTtcblx0XHRcdHZhbHVlcy5zcGxpY2UoIGluZGV4LCAwLCB2YWx1ZSApO1xuXG5cdFx0fVxuXHR9ICk7XG5cbn1cblxuY2xhc3MgVGltZVByb3BlcnR5IHtcblxuXHRjb25zdHJ1Y3RvcigpIHtcblxuXHRcdHRoaXMudGltZXMgPSBbXTtcblx0XHR0aGlzLnZhbHVlcyA9IFtdO1xuXG5cdH1cblxuXHRzZXQoIHRpbWUsIHZhbHVlICkge1xuXG5cdFx0bGV0IGluZGV4ID0gdGhpcy50aW1lcy5sZW5ndGg7XG5cblx0XHR3aGlsZSAoIGluZGV4ID4gMCAmJiB0aGlzLnRpbWVzWyBpbmRleCAtIDEgXSA+IHRpbWUgKVxuXHRcdFx0aW5kZXggLS07XG5cblx0XHRpZiAoIGluZGV4ICE9PSB0aGlzLnRpbWVzLmxlbmd0aCAmJiB0aGlzLnRpbWVzWyBpbmRleCBdID09PSB0aW1lICkge1xuXG5cdFx0XHRpZiAoIHRoaXMudmFsdWVzWyBpbmRleCBdID09PSB2YWx1ZSApIHJldHVybjtcblxuXHRcdFx0dGhpcy52YWx1ZXNbIGluZGV4IF0gPSB2YWx1ZTtcblx0XHRcdHRoaXMubGFzdFRpbWUgPSB1bmRlZmluZWQ7XG5cblx0XHR9XG5cblx0XHR0aGlzLnRpbWVzLnNwbGljZSggaW5kZXgsIDAsIHRpbWUgKTtcblx0XHR0aGlzLnZhbHVlcy5zcGxpY2UoIGluZGV4LCAwLCB2YWx1ZSApO1xuXG5cdH1cblxuXHRnZXQoIHRpbWUgKSB7XG5cblx0XHRpZiAoIHRoaXMubGFzdFRpbWUgPT09IHRpbWUgKSByZXR1cm4gdGhpcy5sYXN0VmFsdWU7XG5cdFx0aWYgKCB0aGlzLnRpbWVzLmxlbmd0aCA9PT0gMCApIHJldHVybiB1bmRlZmluZWQ7XG5cblx0XHRsZXQgaW5kZXggPSB0aGlzLnRpbWVzLmxlbmd0aCAtIDE7XG5cblx0XHR3aGlsZSAoIGluZGV4ID4gMCAmJiB0aGlzLnRpbWVzWyBpbmRleCBdID4gdGltZSApXG5cdFx0XHRpbmRleCAtLTtcblxuXHRcdGlmICggdHlwZW9mIHRoaXMudmFsdWVzWyBpbmRleCBdID09PSBcImZ1bmN0aW9uXCIgKVxuXHRcdFx0dGhpcy5sYXN0VmFsdWUgPSB0aGlzLnZhbHVlc1sgaW5kZXggXSggdGltZSApO1xuXHRcdGVsc2Vcblx0XHRcdHRoaXMubGFzdFZhbHVlID0gdGhpcy52YWx1ZXNbIGluZGV4IF07XG5cblx0XHRyZXR1cm4gdGhpcy5sYXN0VmFsdWU7XG5cblx0fVxuXG59XG5cbmV4cG9ydCB7IFRpbWVQcm9wZXJ0eSwgdGltZVByb3BlcnR5IH07XG5leHBvcnQgZGVmYXVsdCB0aW1lUHJvcGVydHk7XG4iLCJcbmV4cG9ydCBkZWZhdWx0IFtdO1xuIiwiXG4vLyBGcm9tIGh0dHA6Ly93d3cubWF0aG9wZW5yZWYuY29tL2Nvb3JkcG9seWdvbmFyZWEyLmh0bWxcbmZ1bmN0aW9uIGFyZWFPZlBvbHlnb24oIHBvbHlnb24gKSB7XG5cblx0bGV0IGFyZWEgPSAwO1xuXG5cdGZvciAoIGxldCBpID0gMTsgaSA8IHBvbHlnb24ubGVuZ3RoOyBpICsrIClcblx0XHRhcmVhICs9ICggcG9seWdvblsgaSAtIDEgXS54ICsgcG9seWdvblsgaSBdLnggKSAqICggcG9seWdvblsgaSAtIDEgXS55IC0gcG9seWdvblsgaSBdLnkgKTtcblxuXHRyZXR1cm4gYXJlYTtcblxufVxuXG5mdW5jdGlvbiBhcmVhT2ZQb2x5Z29ucyggcG9seWdvbnMgKSB7XG5cblx0bGV0IGFyZWEgPSAwO1xuXG5cdGZvciAoIGxldCBpID0gMDsgaSA8IHBvbHlnb25zLmxlbmd0aDsgaSArKyApXG5cdFx0YXJlYSArPSBhcmVhT2ZQb2x5Z29uKCBwb2x5Z29uc1sgaSBdICk7XG5cblx0cmV0dXJuIGFyZWE7XG5cbn1cblxuZnVuY3Rpb24gcG9pbnRJblBvbHlnb24oIHBvaW50LCBwb2x5Z29uICkge1xuXG5cdGxldCBpbnNpZGUgPSBmYWxzZTtcblxuICAgIC8vIEdyYWIgdGhlIGZpcnN0IHZlcnRleCwgTG9vcCB0aHJvdWdoIHZlcnRpY2VzXG5cdGZvciAoIGxldCBpID0gMSwgcCA9IHBvbHlnb25bIDAgXTsgaSA8PSBwb2x5Z29uLmxlbmd0aDsgaSArKyApIHtcblxuICAgICAgICAvL0dyYWIgdGhlIG5leHQgdmVydGV4ICh0byBmb3JtIGEgc2VnbWVudClcblx0XHRjb25zdCBxID0gaSA9PT0gcG9seWdvbi5sZW5ndGggPyBwb2x5Z29uWyAwIF0gOiBwb2x5Z29uWyBpIF07XG5cbiAgICAgICAgLy9UZXN0IGlmIHRoZSBwb2ludCBtYXRjaGVzIGVpdGhlciB2ZXJ0ZXhcblx0XHRpZiAoIHEueSA9PT0gcG9pbnQueSAmJiAoIHEueCA9PT0gcG9pbnQueCB8fCBwLnkgPT09IHBvaW50LnkgJiYgcS54ID4gcG9pbnQueCA9PT0gcC54IDwgcG9pbnQueCApIClcblx0XHRcdHJldHVybiBmYWxzZTtcblxuICAgICAgICAvL09ubHkgY29uc2lkZXIgc2VnbWVudHMgd2hvc2UgKHZlcnRpY2FsKSBpbnRlcnZhbCB0aGUgcG9pbnQgZml0cyBpblxuXHRcdGlmICggcC55IDwgcG9pbnQueSAhPT0gcS55IDwgcG9pbnQueSApXG5cbiAgICAgICAgICAgIC8vSWYgb25lIGVkZ2UgaXMgdG8gdGhlIHJpZ2h0IG9mIHVzXG5cdFx0XHRpZiAoIHAueCA+PSBwb2ludC54IClcblxuICAgICAgICAgICAgICAgIC8vQW5kIHRoZSBvdGhlciBpcyBhcyB3ZWxsIChhIHdhbGwpXG5cdFx0XHRcdGlmICggcS54ID4gcG9pbnQueCApIGluc2lkZSA9ICEgaW5zaWRlO1xuXG5cdFx0XHRcdGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vT3RoZXJ3aXNlIGNhbGN1bGF0ZSBpZiB3ZSBmYWxsIHRvIGxlZnQgb3IgcmlnaHRcblx0XHRcdFx0XHRjb25zdCBkID0gKCBwLnggLSBwb2ludC54ICkgKiAoIHEueSAtIHBvaW50LnkgKSAtICggcS54IC0gcG9pbnQueCApICogKCBwLnkgLSBwb2ludC55ICk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy9XZSdyZSBvbiBpdCAoRkxPQVQgUE9JTlQpXG5cdFx0XHRcdFx0aWYgKCBkID49IC0gMWUtNyAmJiBkIDw9IDFlLTcgKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgLy9XZSBmYWxsIHRvIHRoZSBsZWZ0XG5cdFx0XHRcdFx0ZWxzZSBpZiAoIGQgPiAwID09PSBxLnkgPiBwLnkgKSBpbnNpZGUgPSAhIGluc2lkZTtcblxuXHRcdFx0XHR9XG5cblx0XHRcdGVsc2UgaWYgKCBxLnggPiBwb2ludC54ICkge1xuXG5cdFx0XHRcdGNvbnN0IGQgPSAoIHAueCAtIHBvaW50LnggKSAqICggcS55IC0gcG9pbnQueSApIC0gKCBxLnggLSBwb2ludC54ICkgKiAoIHAueSAtIHBvaW50LnkgKTtcblxuXHRcdFx0XHRpZiAoIGQgPj0gLSAxZS03ICYmIGQgPD0gMWUtNyApIHJldHVybiBmYWxzZTtcblx0XHRcdFx0ZWxzZSBpZiAoIGQgPiAwID09PSBxLnkgPiBwLnkgKSBpbnNpZGUgPSAhIGluc2lkZTtcblxuXHRcdFx0fVxuXG5cdFx0cCA9IHE7XG5cblx0fVxuXG5cdHJldHVybiBpbnNpZGU7XG5cbn1cblxuZnVuY3Rpb24gcG9pbnRJblNvbWVQb2x5Z29uKCBwb2ludCwgcG9seWdvbnMgKSB7XG5cblx0Zm9yICggbGV0IGkgPSAwOyBpIDwgcG9seWdvbnMubGVuZ3RoOyBpICsrIClcblx0XHRpZiAoIHBvaW50SW5Qb2x5Z29uKCBwb2ludCwgcG9seWdvbnMgKSApIHJldHVybiB0cnVlO1xuXG5cdHJldHVybiBmYWxzZTtcblxufVxuXG5leHBvcnQge1xuICAgIGFyZWFPZlBvbHlnb24sXG4gICAgYXJlYU9mUG9seWdvbnMsXG4gICAgcG9pbnRJblBvbHlnb24sXG4gICAgcG9pbnRJblNvbWVQb2x5Z29uXG59O1xuIiwiXG5pbXBvcnQgeyBwb2ludEluUG9seWdvbiwgcG9pbnRJblNvbWVQb2x5Z29uIH0gZnJvbSBcIi4uL21hdGgvZ2VvbWV0cnkuanNcIjtcblxuY2xhc3MgVGVycmFpbiB7XG5cblx0Y29uc3RydWN0b3IoIHByb3BzICkge1xuXG5cdFx0T2JqZWN0LmFzc2lnbiggdGhpcywgcHJvcHMgKTtcblxuXHR9XG5cblx0Ly8gVEhpcyBpcyBtZWFudCB0byBiZSBvcHRpbWl6ZWQgdXNpbmcgYSBxdWFkdHJlZVxuXHRzZWxlY3RVbml0c0JvdW5kZWRCeVJlY3RhbmdsZSggcmVjdCApIHtcblxuXHRcdGxldCB1bml0cyA9IHRoaXMudW5pdHMgfHwgdGhpcy5hcHAgJiYgdGhpcy5hcHAudW5pdHM7XG5cblx0XHRpZiAoICEgdW5pdHMgfHwgISB1bml0cy5sZW5ndGggKSByZXR1cm4gW107XG5cblx0XHRyZXR1cm4gdW5pdHMuZmlsdGVyKCB1bml0ID0+IHJlY3QuY29udGFpbnMoIHVuaXQgKSApO1xuXG5cdH1cblxuXHRzZWxlY3RVbml0c0JvdW5kZWRCeVBvbHlnb24oIHBvbHlnb24gKSB7XG5cblx0XHRsZXQgdW5pdHMgPSB0aGlzLnVuaXRzIHx8IHRoaXMuYXBwICYmIHRoaXMuYXBwLnVuaXRzO1xuXG5cdFx0aWYgKCAhIHVuaXRzIHx8ICEgdW5pdHMubGVuZ3RoICkgcmV0dXJuIFtdO1xuXG5cdFx0cmV0dXJuIHVuaXRzLmZpbHRlciggdW5pdCA9PiBwb2ludEluUG9seWdvbiggdW5pdCwgcG9seWdvbiApICk7XG5cblx0fVxuXG5cdHNlbGVjdFVuaXRzQm91bmRlZEJ5UG9seWdvbnMoIHBvbHlnb25zICkge1xuXG5cdFx0bGV0IHVuaXRzID0gdGhpcy51bml0cyB8fCB0aGlzLmFwcCAmJiB0aGlzLmFwcC51bml0cztcblxuXHRcdGlmICggISB1bml0cyB8fCAhIHVuaXRzLmxlbmd0aCApIHJldHVybiBbXTtcblxuXHRcdHJldHVybiB1bml0cy5maWx0ZXIoIHVuaXQgPT4gcG9pbnRJblNvbWVQb2x5Z29uKCB1bml0LCBwb2x5Z29ucyApICk7XG5cblx0fVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IFRlcnJhaW47XG4iLCJcbmltcG9ydCBIYW5kbGUgZnJvbSBcIi4uL2NvcmUvSGFuZGxlLmpzXCI7XG5pbXBvcnQgeyBpc0Jyb3dzZXIgfSBmcm9tIFwiLi4vbWlzYy9lbnYuanNcIjtcblxuaW1wb3J0IG1vZGVscyBmcm9tIFwiLi9tb2RlbHMuanNcIjtcblxuY2xhc3MgRG9vZGFkIGV4dGVuZHMgSGFuZGxlIHtcblxuXHRjb25zdHJ1Y3RvciggcHJvcHMgKSB7XG5cblx0XHRzdXBlciggcHJvcHMgKTtcblxuXHRcdHRoaXMudXBkYXRlcyA9IFtdO1xuXG5cdFx0dGhpcy5zaGFkb3dQcm9wcyA9IHt9O1xuXG5cdFx0aWYgKCB0aGlzLmVudGl0eVR5cGUgPT09IERvb2RhZCApXG5cdFx0XHRPYmplY3QuYXNzaWduKCB0aGlzLCB7IHg6IDAsIHk6IDAgfSwgcHJvcHMgKTtcblxuXHRcdHRoaXMuX2RpcnR5ID0gMDtcblxuXHR9XG5cblx0Z2V0IGtleSgpIHtcblxuXHRcdHJldHVybiBcImRcIiArIHRoaXMuaWQ7XG5cblx0fVxuXG5cdGdldCBtb2RlbCgpIHtcblxuXHRcdHJldHVybiB0aGlzLnNoYWRvd1Byb3BzLm1vZGVsO1xuXG5cdH1cblxuXHRzZXQgbW9kZWwoIG1vZGVsICkge1xuXG5cdFx0dGhpcy5zaGFkb3dQcm9wcy5tb2RlbCA9IG1vZGVsO1xuXG5cdFx0aWYgKCBtb2RlbHNbIG1vZGVsIF0ucHJvdG90eXBlIGluc3RhbmNlb2YgVEhSRUUuTWVzaCApIHtcblxuXHRcdFx0dGhpcy5tZXNoID0gbmV3IG1vZGVsc1sgbW9kZWwgXSggbW9kZWwgKTtcblx0XHRcdHRoaXMubWVzaC51c2VyRGF0YSA9IHRoaXMuaWQ7XG5cblx0XHR9IGVsc2UgbW9kZWxzWyBtb2RlbCBdLmFkZEV2ZW50TGlzdGVuZXIoIFwicmVhZHlcIiwgKCB7IG1vZGVsOiBtb2RlbENsYXNzIH0gKSA9PiB7XG5cblx0XHRcdHRoaXMubWVzaCA9IG5ldyBtb2RlbENsYXNzKCBtb2RlbCApO1xuXG5cdFx0XHR0aGlzLm1lc2gudXNlckRhdGEgPSB0aGlzLmlkO1xuXHRcdFx0dGhpcy5tZXNoLnBvc2l0aW9uLnggPSB0aGlzLnNoYWRvd1Byb3BzLnggfHwgMDtcblx0XHRcdHRoaXMubWVzaC5wb3NpdGlvbi55ID0gdGhpcy5zaGFkb3dQcm9wcy55IHx8IDA7XG5cdFx0XHR0aGlzLm1lc2gucG9zaXRpb24ueiA9IHRoaXMuc2hhZG93UHJvcHMueiB8fCAwO1xuXG5cdFx0XHRpZiAoIHRoaXMub3duZXIgJiYgdGhpcy5tZXNoLmFjY2VudEZhY2VzICkge1xuXG5cdFx0XHRcdGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMubWVzaC5hY2NlbnRGYWNlcy5sZW5ndGg7IGkgKysgKVxuXHRcdFx0XHRcdHRoaXMubWVzaC5nZW9tZXRyeS5mYWNlc1sgdGhpcy5tZXNoLmFjY2VudEZhY2VzWyBpIF0gXS5jb2xvci5zZXQoIHRoaXMub3duZXIuY29sb3IuaGV4ICk7XG5cblx0XHRcdFx0dGhpcy5tZXNoLmdlb21ldHJ5LmNvbG9yc05lZWRVcGRhdGUgPSB0cnVlO1xuXG5cdFx0XHR9XG5cblx0XHR9ICk7XG5cblx0fVxuXG5cdGdldCBtZXNoKCkge1xuXG5cdFx0cmV0dXJuIHRoaXMuc2hhZG93UHJvcHMubWVzaDtcblxuXHR9XG5cblx0c2V0IG1lc2goIG1lc2ggKSB7XG5cblx0XHRpZiAoIHRoaXMuc2hhZG93UHJvcHMubWVzaCBpbnN0YW5jZW9mIFRIUkVFLk1lc2ggKVxuXHRcdFx0dGhpcy5kaXNwYXRjaEV2ZW50KCB7IHR5cGU6IFwibWVzaFVubG9hZGVkXCIgfSApO1xuXG5cdFx0dGhpcy5zaGFkb3dQcm9wcy5tZXNoID0gbWVzaDtcblxuXHRcdHRoaXMuZGlzcGF0Y2hFdmVudCggeyB0eXBlOiBcIm1lc2hMb2FkZWRcIiB9ICk7XG5cblx0fVxuXG5cdGdldCB4KCkge1xuXG5cdFx0aWYgKCB0eXBlb2YgdGhpcy5zaGFkb3dQcm9wcy54ID09PSBcImZ1bmN0aW9uXCIgKVxuXHRcdFx0cmV0dXJuIHRoaXMuc2hhZG93UHJvcHMueCggdGhpcy5hcHAgPyB0aGlzLmFwcC50aW1lIDogMCApO1xuXG5cdFx0cmV0dXJuIHRoaXMuc2hhZG93UHJvcHMueDtcblxuXHR9XG5cblx0c2V0IHgoIHggKSB7XG5cblx0XHQvLyBjb25zb2xlLmxvZyggdGhpcy5jb25zdHJ1Y3Rvci5uYW1lLCB4ICk7XG5cblx0XHRpZiAoIHR5cGVvZiB4ID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIHRoaXMuc2hhZG93UHJvcHMueCAhPT0gXCJmdW5jdGlvblwiICkgKysgdGhpcy5kaXJ0eTtcblx0XHRlbHNlIGlmICggdHlwZW9mIHggIT09IFwiZnVuY3Rpb25cIiApIHtcblxuXHRcdFx0aWYgKCB0aGlzLm1lc2ggKSB0aGlzLm1lc2gucG9zaXRpb24ueCA9IHg7XG5cdFx0XHRpZiAoIHR5cGVvZiB0aGlzLnNoYWRvd1Byb3BzLnggPT09IFwiZnVuY3Rpb25cIiApKysgdGhpcy5kaXJ0eTtcblxuXHRcdH1cblxuXHRcdHRoaXMuc2hhZG93UHJvcHMueCA9IHg7XG5cblx0fVxuXG5cdGdldCB5KCkge1xuXG5cdFx0aWYgKCB0eXBlb2YgdGhpcy5zaGFkb3dQcm9wcy55ID09PSBcImZ1bmN0aW9uXCIgKVxuXHRcdFx0cmV0dXJuIHRoaXMuc2hhZG93UHJvcHMueSggdGhpcy5hcHAgPyB0aGlzLmFwcC50aW1lIDogMCApO1xuXG5cdFx0cmV0dXJuIHRoaXMuc2hhZG93UHJvcHMueTtcblxuXHR9XG5cblx0c2V0IHkoIHkgKSB7XG5cblx0XHRpZiAoIHR5cGVvZiB5ID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIHRoaXMuc2hhZG93UHJvcHMueSAhPT0gXCJmdW5jdGlvblwiICkgKysgdGhpcy5kaXJ0eTtcblx0XHRlbHNlIGlmICggdHlwZW9mIHkgIT09IFwiZnVuY3Rpb25cIiApIHtcblxuXHRcdFx0aWYgKCB0aGlzLm1lc2ggKSB0aGlzLm1lc2gucG9zaXRpb24ueSA9IHk7XG5cdFx0XHRpZiAoIHR5cGVvZiB0aGlzLnNoYWRvd1Byb3BzLnkgPT09IFwiZnVuY3Rpb25cIiApKysgdGhpcy5kaXJ0eTtcblxuXHRcdH1cblxuXHRcdHRoaXMuc2hhZG93UHJvcHMueSA9IHk7XG5cblx0fVxuXG5cdGdldCBkaXJ0eSgpIHtcblxuXHRcdHJldHVybiB0aGlzLl9kaXJ0eTtcblxuXHR9XG5cblx0c2V0IGRpcnR5KCBkaXJ0ICkge1xuXG5cdFx0aWYgKCBpc05hTiggZGlydCApICkgZGlydCA9IDA7XG5cblx0XHRpZiAoICEgdGhpcy5fZGlydHkgJiYgZGlydCApIHRoaXMuZGlzcGF0Y2hFdmVudCggeyB0eXBlOiBcImRpcnR5XCIgfSApO1xuXHRcdGVsc2UgaWYgKCB0aGlzLl9kaXJ0eSAmJiAhIGRpcnQgKSB0aGlzLmRpc3BhdGNoRXZlbnQoIHsgdHlwZTogXCJjbGVhblwiIH0gKTtcblxuXHRcdHRoaXMuX2RpcnR5ID0gZGlydDtcblxuXHR9XG5cblx0dG9TdGF0ZSgpIHtcblxuXHRcdHJldHVybiBPYmplY3QuYXNzaWduKCBzdXBlci50b1N0YXRlKCksIHtcblx0XHRcdHg6IHRoaXMuc2hhZG93UHJvcHMueCB8fCB0aGlzLngsXG5cdFx0XHR5OiB0aGlzLnNoYWRvd1Byb3BzLnkgfHwgdGhpcy55LFxuXHRcdFx0ZmFjaW5nOiB0aGlzLmZhY2luZ1xuXHRcdH0gKTtcblxuXHR9XG5cblx0cmVuZGVyKCB0aW1lICkge1xuXG5cdFx0aWYgKCAhIGlzQnJvd3NlciB8fCAhIHRoaXMubWVzaCApIHJldHVybjtcblxuXHRcdGlmICggdHlwZW9mIHRoaXMuc2hhZG93UHJvcHMueCA9PT0gXCJmdW5jdGlvblwiICkgdGhpcy5tZXNoLnBvc2l0aW9uLnggPSB0aGlzLnNoYWRvd1Byb3BzLngoIHRpbWUgKTtcblx0XHRpZiAoIHR5cGVvZiB0aGlzLnNoYWRvd1Byb3BzLnkgPT09IFwiZnVuY3Rpb25cIiApIHRoaXMubWVzaC5wb3NpdGlvbi55ID0gdGhpcy5zaGFkb3dQcm9wcy55KCB0aW1lICk7XG5cblx0fVxuXG5cdHVwZGF0ZSggdGltZSApIHtcblxuXHRcdGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMudXBkYXRlcy5sZW5ndGg7IGkgKysgKVxuXHRcdFx0dGhpcy51cGRhdGVzWyBpIF0oIHRpbWUgKTtcblxuXHR9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgRG9vZGFkO1xuIiwiXG5pbXBvcnQgRG9vZGFkIGZyb20gXCIuL0Rvb2RhZC5qc1wiO1xuXG5jbGFzcyBVbml0IGV4dGVuZHMgRG9vZGFkIHtcblxuXHRjb25zdHJ1Y3RvciggcHJvcHMgKSB7XG5cblx0XHRzdXBlciggcHJvcHMgKTtcblxuXHRcdHRoaXMudXBkYXRlcyA9IFtdO1xuXG5cdFx0dGhpcy5zaGFkb3dQcm9wcyA9IHt9O1xuXG5cdFx0aWYgKCB0aGlzLmVudGl0eVR5cGUgPT09IFVuaXQgKVxuXHRcdFx0T2JqZWN0LmFzc2lnbiggdGhpcywgeyB4OiAwLCB5OiAwIH0sIHByb3BzICk7XG5cblx0XHR0aGlzLl9kaXJ0eSA9IDA7XG5cblx0fVxuXG5cdGdldCBrZXkoKSB7XG5cblx0XHRyZXR1cm4gXCJ1XCIgKyB0aGlzLmlkO1xuXG5cdH1cblxuXHRzZXQgb3duZXIoIG93bmVyICkge1xuXG5cdFx0aWYgKCB0aGlzLnNoYWRvd1Byb3BzLm93bmVyID09PSBvd25lciApIHJldHVybjtcblxuXHRcdHRoaXMuc2hhZG93UHJvcHMub3duZXIgPSBvd25lcjtcblxuXHRcdC8vIE51bGwgYW5kIHVuZGVmaW5lZFxuXHRcdGlmICggb3duZXIgPT0gdW5kZWZpbmVkICkgcmV0dXJuO1xuXG5cdFx0aWYgKCB0aGlzLm1lc2ggJiYgdGhpcy5tZXNoLmFjY2VudEZhY2VzICkge1xuXG5cdFx0XHRmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLm1lc2guYWNjZW50RmFjZXMubGVuZ3RoOyBpICsrIClcblx0XHRcdFx0dGhpcy5tZXNoLmdlb21ldHJ5LmZhY2VzWyB0aGlzLm1lc2guYWNjZW50RmFjZXNbIGkgXSBdLmNvbG9yLnNldCggb3duZXIuY29sb3IuaGV4ICk7XG5cblx0XHRcdHRoaXMubWVzaC5nZW9tZXRyeS5jb2xvcnNOZWVkVXBkYXRlID0gdHJ1ZTtcblxuXHRcdH1cblxuXHR9XG5cblx0Z2V0IG93bmVyKCkge1xuXG5cdFx0cmV0dXJuIHRoaXMuc2hhZG93UHJvcHMub3duZXI7XG5cblx0fVxuXG5cdHRvU3RhdGUoKSB7XG5cblx0XHRyZXR1cm4gT2JqZWN0LmFzc2lnbiggc3VwZXIudG9TdGF0ZSgpLCB7XG5cdFx0XHRvd25lcjogdGhpcy5vd25lclxuXHRcdH0gKTtcblxuXHR9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgVW5pdDtcbiIsIlxuaW1wb3J0IHsgaXNCcm93c2VyIH0gZnJvbSBcIi4vZW52LmpzXCI7XG5cbmxldCBmZXRjaEZpbGU7XG5cbmlmICggaXNCcm93c2VyICkge1xuXG5cdGZldGNoRmlsZSA9IHBhdGggPT4gbmV3IFByb21pc2UoICggcmVzb2x2ZSwgcmVqZWN0ICkgPT4ge1xuXG5cdFx0Y29uc3QgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG5cdFx0cmVxdWVzdC5vbnRpbWVvdXQgPSBlcnIgPT4gcmVqZWN0KCBlcnIgKTtcblxuXHRcdHJlcXVlc3Qub25sb2FkID0gKCkgPT4ge1xuXG5cdFx0XHRpZiAoIHJlcXVlc3QucmVhZHlTdGF0ZSAhPT0gNCApIHJldHVybjtcblxuXHRcdFx0aWYgKCByZXF1ZXN0LnN0YXR1cyA+PSA0MDAgKSByZXR1cm4gcmVqZWN0KCByZXF1ZXN0ICk7XG5cblx0XHRcdHJlc29sdmUoIHJlcXVlc3QucmVzcG9uc2VUZXh0ICk7XG5cblx0XHR9O1xuXG5cdFx0cmVxdWVzdC5vcGVuKCBcIkdFVFwiLCBwYXRoLCB0cnVlICk7XG5cdFx0cmVxdWVzdC50aW1lb3V0ID0gNTAwMDtcblx0XHRyZXF1ZXN0LnNlbmQoKTtcblxuXHRcdHJldHVybiByZXF1ZXN0LnJlc3BvbnNlVGV4dDtcblxuXHR9ICk7XG5cbn0gZWxzZSB7XG5cblx0Y29uc3QgZnMgPSByZXF1aXJlKCBcImZzXCIgKTtcblxuXHRmZXRjaEZpbGUgPSBwYXRoID0+IG5ldyBQcm9taXNlKCAoIHJlc29sdmUsIHJlamVjdCApID0+XG4gICAgICAgIGZzLnJlYWRGaWxlKCBwYXRoLCBcInV0ZjhcIiwgKCBlcnIsIHJlcyApID0+IGVyciA/IHJlamVjdCggZXJyICkgOiByZXNvbHZlKCByZXMgKSApICk7XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgZmV0Y2hGaWxlO1xuIiwiLy8gQSBwb3J0IG9mIGFuIGFsZ29yaXRobSBieSBKb2hhbm5lcyBCYWFnw7hlIDxiYWFnb2VAYmFhZ29lLmNvbT4sIDIwMTBcbi8vIGh0dHA6Ly9iYWFnb2UuY29tL2VuL1JhbmRvbU11c2luZ3MvamF2YXNjcmlwdC9cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ucXVpbmxhbi9iZXR0ZXItcmFuZG9tLW51bWJlcnMtZm9yLWphdmFzY3JpcHQtbWlycm9yXG4vLyBPcmlnaW5hbCB3b3JrIGlzIHVuZGVyIE1JVCBsaWNlbnNlIC1cblxuLy8gQ29weXJpZ2h0IChDKSAyMDEwIGJ5IEpvaGFubmVzIEJhYWfDuGUgPGJhYWdvZUBiYWFnb2Uub3JnPlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbi8vIFJlZm9ybWF0dGVkIGFuZCBzd2FwcGVkIGZ1bmN0aW9ucyB3aXRoIGxhbWJkYXMsIGJ1dCBvdGhlcndpc2UgdGhlIHNhbWVcblxuZnVuY3Rpb24gQWxlYSggc2VlZCApIHtcblxuXHRjb25zdCBtZSA9IHRoaXM7XG5cdGNvbnN0IG1hc2ggPSBNYXNoKCk7XG5cblx0bWUubmV4dCA9ICgpID0+IHtcblxuXHRcdC8vIGNvbnNvbGUubG9nKCBcInJhbmRvbVwiICk7XG5cblx0XHRjb25zdCB0ID0gMjA5MTYzOSAqIG1lLnMwICsgbWUuYyAqIDIuMzI4MzA2NDM2NTM4Njk2M2UtMTA7IC8vIDJeLTMyXG5cdFx0bWUuczAgPSBtZS5zMTtcblx0XHRtZS5zMSA9IG1lLnMyO1xuXG5cdFx0cmV0dXJuIG1lLnMyID0gdCAtICggbWUuYyA9IHQgfCAwICk7XG5cblx0fTtcblxuXHQvLyBBcHBseSB0aGUgc2VlZGluZyBhbGdvcml0aG0gZnJvbSBCYWFnb2UuXG5cdG1lLmMgPSAxO1xuXHRtZS5zMCA9IG1hc2goIFwiIFwiICk7XG5cdG1lLnMxID0gbWFzaCggXCIgXCIgKTtcblx0bWUuczIgPSBtYXNoKCBcIiBcIiApO1xuXG5cdG1lLnMwIC09IG1hc2goIHNlZWQgKTtcblx0aWYgKCBtZS5zMCA8IDAgKSBtZS5zMCArPSAxO1xuXG5cdG1lLnMxIC09IG1hc2goIHNlZWQgKTtcblx0aWYgKCBtZS5zMSA8IDAgKSBtZS5zMSArPSAxO1xuXG5cdG1lLnMyIC09IG1hc2goIHNlZWQgKTtcblx0aWYgKCBtZS5zMiA8IDAgKSBtZS5zMiArPSAxO1xuXG59XG5cbmZ1bmN0aW9uIGNvcHkoIGYsIHQgKSB7XG5cblx0dC5jID0gZi5jO1xuXHR0LnMwID0gZi5zMDtcblx0dC5zMSA9IGYuczE7XG5cdHQuczIgPSBmLnMyO1xuXG5cdHJldHVybiB0O1xuXG59XG5cbmZ1bmN0aW9uIGltcGwoIHNlZWQsIG9wdHMgKSB7XG5cblx0Y29uc3QgeGcgPSBuZXcgQWxlYSggc2VlZCApLFxuXHRcdHN0YXRlID0gb3B0cyAmJiBvcHRzLnN0YXRlLFxuXHRcdHBybmcgPSB4Zy5uZXh0O1xuXG5cdHBybmcuaW50MzIgPSAoKSA9PiAoIHhnLm5leHQoKSAqIDB4MTAwMDAwMDAwICkgfCAwO1xuXHRwcm5nLmRvdWJsZSA9ICgpID0+IHBybmcoKSArICggcHJuZygpICogMHgyMDAwMDAgfCAwICkgKiAxLjExMDIyMzAyNDYyNTE1NjVlLTE2OyAvLyAyXi01Mztcblx0cHJuZy5xdWljayA9IHBybmc7XG5cblx0aWYgKCBzdGF0ZSApIHtcblxuXHRcdGlmICggdHlwZW9mIHN0YXRlID09PSBcIm9iamVjdFwiICkgY29weSggc3RhdGUsIHhnICk7XG5cblx0XHRwcm5nLnN0YXRlID0gKCkgPT4gY29weSggeGcsIHt9ICk7XG5cblx0fVxuXG5cdHJldHVybiBwcm5nO1xuXG59XG5cbmZ1bmN0aW9uIE1hc2goKSB7XG5cblx0bGV0IG4gPSAweGVmYzgyNDlkO1xuXG5cdGNvbnN0IG1hc2ggPSAoIGRhdGEgKSA9PiB7XG5cblx0XHRkYXRhID0gZGF0YS50b1N0cmluZygpO1xuXHRcdGZvciAoIGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpICsrICkge1xuXG5cdFx0XHRuICs9IGRhdGEuY2hhckNvZGVBdCggaSApO1xuXHRcdFx0bGV0IGggPSAwLjAyNTE5NjAzMjgyNDE2OTM4ICogbjtcblx0XHRcdG4gPSBoID4+PiAwO1xuXHRcdFx0aCAtPSBuO1xuXHRcdFx0aCAqPSBuO1xuXHRcdFx0biA9IGggPj4+IDA7XG5cdFx0XHRoIC09IG47XG5cdFx0XHRuICs9IGggKiAweDEwMDAwMDAwMDsgLy8gMl4zMlxuXG5cdFx0fVxuXG5cdFx0cmV0dXJuICggbiA+Pj4gMCApICogMi4zMjgzMDY0MzY1Mzg2OTYzZS0xMDsgLy8gMl4tMzJcblxuXHR9O1xuXG5cdHJldHVybiBtYXNoO1xuXG59XG5cbmV4cG9ydCBkZWZhdWx0IGltcGw7XG4iLCJcbmltcG9ydCBQbGF5ZXIgZnJvbSBcIi4uLy4uL2NvcmUvUGxheWVyLmpzXCI7XG5pbXBvcnQgKiBhcyBlbnYgZnJvbSBcIi4uLy4uL21pc2MvZW52LmpzXCI7XG5cbmltcG9ydCBSYW5kb20gZnJvbSBcIi4uLy4uLy4uL2xpYi9zZWVkcmFuZG9tLWFsZWEuanNcIjtcblxuY29uc3QgcmVzZXJ2ZWRFdmVudFR5cGVzID0gWyBcInBsYXllckpvaW5cIiwgXCJwbGF5ZXJMZWF2ZVwiLCBcInN5bmNcIiwgXCJzdGF0ZVwiIF07XG5cbi8vIFNlcnZlclxuZnVuY3Rpb24gY2xpZW50Sm9pbkhhbmRsZXIoIGFwcCwgZSApIHtcblxuXHRjb25zdCBwbGF5ZXIgPSBuZXcgUGxheWVyKCBPYmplY3QuYXNzaWduKCB7IGtleTogXCJwXCIgKyBlLmNsaWVudC5pZCB9LCBlLmNsaWVudCApICk7XG5cdGNvbnN0IHBsYXllclN0YXRlID0gcGxheWVyLnRvU3RhdGUoKTtcblxuXHRjb25zdCBzZWVkID0gYXBwLmluaXRpYWxTZWVkICsgcGxheWVyLmlkO1xuXHRhcHAucmFuZG9tID0gbmV3IFJhbmRvbSggc2VlZCApO1xuXG5cdGZvciAoIGxldCBpID0gMDsgaSA8IGFwcC5wbGF5ZXJzLmxlbmd0aDsgaSArKyApXG5cdFx0YXBwLnBsYXllcnNbIGkgXS5zZW5kKCB7XG5cdFx0XHR0eXBlOiBcInBsYXllckpvaW5cIixcblx0XHRcdHRpbWU6IGFwcC50aW1lLFxuXHRcdFx0c2VlZCxcblx0XHRcdHBsYXllcjogcGxheWVyU3RhdGUgfSApO1xuXG5cdGFwcC5wbGF5ZXJzLmFkZCggcGxheWVyICk7XG5cdGFwcC5wbGF5ZXJzLnNvcnQoICggYSwgYiApID0+IGEuaWQgPiBiLmlkID8gMSA6IC0gMSApO1xuXG5cdC8vIGNvbnNvbGUubG9nKCBhcHAuc3RhdGUgKTtcblx0cGxheWVyLnNlbmQoIHtcblx0XHR0eXBlOiBcInN0YXRlXCIsXG5cdFx0dGltZTogYXBwLnRpbWUsXG5cdFx0c3RhdGU6IGFwcC5zdGF0ZSxcblx0XHRzZWVkLFxuXHRcdGxvY2FsOiBwbGF5ZXIudG9KU09OKClcblx0fSwgXCJ0b1N0YXRlXCIgKTtcblxuXHRhcHAuZGlzcGF0Y2hFdmVudCggeyB0eXBlOiBcInBsYXllckpvaW5cIiwgcGxheWVyIH0gKTtcblxufVxuXG4vLyBTZXJ2ZXJcbmZ1bmN0aW9uIGNsaWVudExlYXZlSGFuZGxlciggYXBwLCBlICkge1xuXG5cdGNvbnN0IHBsYXllciA9IGFwcC5wbGF5ZXJzLmRpY3RbIFwicFwiICsgZS5jbGllbnQuaWQgXTtcblxuXHRhcHAubmV0d29yay5zZW5kKCB7IHR5cGU6IFwicGxheWVyTGVhdmVcIiwgcGxheWVyIH0gKTtcblx0YXBwLmRpc3BhdGNoRXZlbnQoIHsgdHlwZTogXCJwbGF5ZXJMZWF2ZVwiLCBwbGF5ZXIgfSApO1xuXG59XG5cbi8vIFNlcnZlclxuLy8gVGhpcyBtb2RpZmllcyB0aGUgYWN0dWFsIGV2ZW50LCByZXBsYWNpbmcgY2xpZW50IHdpdGggcGxheWVyXG5mdW5jdGlvbiBjbGllbnRNZXNzYWdlSGFuZGxlciggYXBwLCBlICkge1xuXG5cdGlmICggISBlLmNsaWVudCApIHJldHVybjtcblxuXHQvLyBJZ25vcmUgdW5zYWZlIG1lc3NhZ2VzXG5cdGlmICggISBlLm1lc3NhZ2UudHlwZSB8fCByZXNlcnZlZEV2ZW50VHlwZXMuaW5kZXhPZiggZS5tZXNzYWdlLnR5cGUgKSAhPT0gLSAxICkgcmV0dXJuO1xuXG5cdC8vIFVwZGF0ZSB0aGUgZ2FtZSBjbG9ja1xuXHRjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuXHRjb25zdCBkZWx0YSA9IG5vdyAtIGFwcC5sYXN0Tm93O1xuXHRhcHAubGFzdE5vdyA9IG5vdztcblx0YXBwLnRpbWUgKz0gZGVsdGE7XG5cblx0Ly8gU2V0IHJlc2VydmVkIHZhbHVlc1xuXHRlLm1lc3NhZ2UucGxheWVyID0gYXBwLnBsYXllcnMuZGljdFsgXCJwXCIgKyBlLmNsaWVudC5pZCBdO1xuXHRlLm1lc3NhZ2UudGltZSA9IGFwcC50aW1lO1xuXG5cdGFwcC5uZXR3b3JrLnNlbmQoIGUubWVzc2FnZSApO1xuXHRhcHAuZGlzcGF0Y2hFdmVudCggZS5tZXNzYWdlICk7XG5cbn1cblxuLy8gU2VydmVyICsgTG9jYWxcbmZ1bmN0aW9uIHBsYXllckpvaW5IYW5kbGVyKCBhcHAsIGUgKSB7XG5cblx0Ly8gRG9uJ3QgZG8gYW55dGhpbmcgb24gdGhlIHNlcnZlclxuXHRpZiAoIGVudi5pc1NlcnZlciApIHJldHVybjtcblxuXHRpZiAoIGUuc2VlZCApIGFwcC5yYW5kb20gPSBuZXcgUmFuZG9tKCBlLnNlZWQgKTtcblxuXHRpZiAoIGFwcC5wbGF5ZXJzLmRpY3RbIFwicFwiICsgZS5wbGF5ZXIuaWQgXSApIHJldHVybjtcblxuXHRuZXcgYXBwLlBsYXllciggT2JqZWN0LmFzc2lnbiggeyBrZXk6IFwicFwiICsgZS5wbGF5ZXIuaWQgfSwgZS5wbGF5ZXIgKSApO1xuXG59XG5cbi8vIFNlcnZlciArIExvY2FsXG5mdW5jdGlvbiBwbGF5ZXJMZWF2ZUhhbmRsZXIoIGFwcCwgZSApIHtcblxuXHRlLnBsYXllci5jb2xvci50YWtlbiA9IGZhbHNlO1xuXG5cdGFwcC5wbGF5ZXJzLnJlbW92ZSggZS5wbGF5ZXIgKTtcblxufVxuXG5mdW5jdGlvbiBzdGF0ZSggYXBwLCBlICkge1xuXG5cdGlmICggZS5sb2NhbCApIGFwcC5sb2NhbFBsYXllciA9IGUubG9jYWw7XG5cdGlmICggZS5zZWVkICkgYXBwLnJhbmRvbSA9IG5ldyBSYW5kb20oIGUuc2VlZCApO1xuXG5cdGZvciAoIGNvbnN0IHByb3AgaW4gZS5zdGF0ZSApXG5cdFx0aWYgKCB0eXBlb2YgZS5zdGF0ZVsgcHJvcCBdICE9PSBcIm9iamVjdFwiIClcblx0XHRcdGFwcC5zdGF0ZVsgcHJvcCBdID0gZS5zdGF0ZVsgcHJvcCBdO1xuXG59XG5cbmV4cG9ydCB7IGNsaWVudEpvaW5IYW5kbGVyLCBjbGllbnRMZWF2ZUhhbmRsZXIsIGNsaWVudE1lc3NhZ2VIYW5kbGVyLCBwbGF5ZXJKb2luSGFuZGxlciwgcmVzZXJ2ZWRFdmVudFR5cGVzLCBwbGF5ZXJMZWF2ZUhhbmRsZXIsIHN0YXRlIH07XG4iLCJcbmltcG9ydCBFdmVudERpc3BhdGNoZXIgZnJvbSBcIi4uLy4uLy4uL2NvcmUvRXZlbnREaXNwYXRjaGVyLmpzXCI7XG4vLyBpbXBvcnQgRXZlbnREaXNwYXRjaGVyIGZyb20gXCIuLi8uLi8uLi8uLi9jb3JlL0V2ZW50RGlzcGF0Y2hlclwiO1xuXG5jbGFzcyBDbGllbnROZXR3b3JrIGV4dGVuZHMgRXZlbnREaXNwYXRjaGVyIHtcblxuXHRjb25zdHJ1Y3RvciggcHJvcHMgPSB7fSApIHtcblxuXHRcdHN1cGVyKCk7XG5cblx0XHR0aGlzLnByb3RvY29sID0gcHJvcHMucHJvdG9jb2wgfHwgXCJ3c1wiO1xuXHRcdHRoaXMuaG9zdCA9IHByb3BzLmhvc3QgfHwgXCJsb2NhbGhvc3RcIjtcblx0XHR0aGlzLnBvcnQgPSBwcm9wcy5wb3J0IHx8IDMwMDA7XG5cdFx0dGhpcy5hcHAgPSBwcm9wcy5hcHA7XG5cdFx0dGhpcy5yZXZpdmVyID0gcHJvcHMucmV2aXZlcjtcblxuXHRcdHRoaXMuY29ubmVjdCgpO1xuXG5cdH1cblxuXHRjb25uZWN0KCkge1xuXG5cdFx0dGhpcy5zb2NrZXQgPSBuZXcgV2ViU29ja2V0KCBgJHt0aGlzLnByb3RvY29sfTovLyR7dGhpcy5ob3N0fToke3RoaXMucG9ydH1gICk7XG5cblx0XHR0aGlzLnNvY2tldC5hZGRFdmVudExpc3RlbmVyKCBcIm1lc3NhZ2VcIiwgZSA9PiB7XG5cblx0XHRcdC8vIGlmICggaXNOYU4oIGUuZGF0YSApICkgY29uc29sZS5sb2coIEpTT04ucGFyc2UoIGUuZGF0YSApICk7XG5cblx0XHRcdGUgPSBKU09OLnBhcnNlKCBlLmRhdGEsIHRoaXMucmV2aXZlciApO1xuXG5cdFx0XHRpZiAoIHR5cGVvZiBlID09PSBcIm51bWJlclwiICkge1xuXG5cdFx0XHRcdHRoaXMuYXBwLnRpbWUgPSBlO1xuXHRcdFx0XHR0aGlzLmFwcC5vZmZpY2lhbFRpbWUgPSBlO1xuXHRcdFx0XHR0aGlzLmFwcC51cGRhdGUoKTtcblx0XHRcdFx0dGhpcy5hcHAuZGlzcGF0Y2hFdmVudCggeyB0eXBlOiBcInRpbWVcIiwgdGltZTogZSB9LCB0cnVlICk7XG5cblx0XHRcdH0gZWxzZSBpZiAoIGUgaW5zdGFuY2VvZiBBcnJheSApIHtcblxuXHRcdFx0XHRmb3IgKCBsZXQgaSA9IDA7IGkgPCBlLmxlbmd0aDsgaSArKyApIHtcblxuXHRcdFx0XHRcdGlmICggdGhpcy5hcHAgJiYgZVsgaSBdLnRpbWUgKSB7XG5cblx0XHRcdFx0XHRcdHRoaXMuYXBwLnRpbWUgPSBlWyBpIF0udGltZTtcblx0XHRcdFx0XHRcdHRoaXMuYXBwLm9mZmljaWFsVGltZSA9IGVbIGkgXS50aW1lO1xuXHRcdFx0XHRcdFx0dGhpcy5hcHAudXBkYXRlKCk7XG5cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR0aGlzLmFwcC5kaXNwYXRjaEV2ZW50KCBlWyBpIF0sIHRydWUgKTtcblxuXHRcdFx0XHR9XG5cblx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0aWYgKCB0aGlzLmFwcCAmJiBlLnRpbWUgKSB7XG5cblx0XHRcdFx0XHR0aGlzLmFwcC50aW1lID0gZS50aW1lO1xuXHRcdFx0XHRcdHRoaXMuYXBwLm9mZmljaWFsVGltZSA9IGUudGltZTtcblx0XHRcdFx0XHR0aGlzLmFwcC51cGRhdGUoKTtcblxuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGhpcy5hcHAuZGlzcGF0Y2hFdmVudCggZSwgdHJ1ZSApO1xuXG5cdFx0XHR9XG5cblx0XHR9ICk7XG5cblx0XHR0aGlzLnNvY2tldC5hZGRFdmVudExpc3RlbmVyKCBcIm9wZW5cIiwgKCkgPT4gdGhpcy5kaXNwYXRjaEV2ZW50KCBcIm9wZW5cIiApICk7XG5cdFx0dGhpcy5zb2NrZXQuYWRkRXZlbnRMaXN0ZW5lciggXCJjbG9zZVwiLCAoKSA9PiB0aGlzLm9uQ2xvc2UoKSApO1xuXG5cdH1cblxuXHRvbkNsb3NlKCkge1xuXG5cdFx0dGhpcy5kaXNwYXRjaEV2ZW50KCBcImNsb3NlXCIgKTtcblxuXHRcdGlmICggdGhpcy5hdXRvUmVjb25uZWN0ICkgdGhpcy5jb25uZWN0KCk7XG5cblx0fVxuXG5cdHNlbmQoIGRhdGEgKSB7XG5cblx0XHRkYXRhID0gSlNPTi5zdHJpbmdpZnkoIGRhdGEsIHRoaXMucmVwbGFjZXIgKTtcblxuXHRcdHRoaXMuc29ja2V0LnNlbmQoIGRhdGEgKTtcblxuXHR9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ2xpZW50TmV0d29yaztcbiIsIlxuLy8gQWRhcGF0ZWQgZnJvbSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9KU09OI1BvbHlmaWxsXG5cbmNvbnN0IHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbmNvbnN0IGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8ICggYSA9PiB0b1N0cmluZy5jYWxsKCBhICkgPT09IFwiW29iamVjdCBBcnJheV1cIiApO1xuY29uc3QgZXNjTWFwID0geyBcIlxcXCJcIjogXCJcXFxcXFxcIlwiLCBcIlxcXFxcIjogXCJcXFxcXFxcXFwiLCBcIlxcYlwiOiBcIlxcXFxiXCIsIFwiXFxmXCI6IFwiXFxcXGZcIiwgXCJcXG5cIjogXCJcXFxcblwiLCBcIlxcclwiOiBcIlxcXFxyXCIsIFwiXFx0XCI6IFwiXFxcXHRcIiB9O1xuY29uc3QgZXNjRnVuYyA9IG0gPT4gZXNjTWFwWyBtIF0gfHwgXCJcXFxcdVwiICsgKCBtLmNoYXJDb2RlQXQoIDAgKSArIDB4MTAwMDAgKS50b1N0cmluZyggMTYgKS5zdWJzdHIoIDEgKTtcbmNvbnN0IGVzY1JFID0gL1tcXFxcXCJcXHUwMDAwLVxcdTAwMUZcXHUyMDI4XFx1MjAyOV0vZztcbmNvbnN0IGRlZmF1bHRSZXBsYWNlciA9ICggcHJvcCwgdmFsdWUgKSA9PiB2YWx1ZTtcblxuZnVuY3Rpb24gc3RyaW5naWZ5KCB2YWx1ZSwgcmVwbGFjZXIgPSBkZWZhdWx0UmVwbGFjZXIsIHRvSlNPTiA9IFwidG9KU09OXCIgKSB7XG5cblx0aWYgKCB2YWx1ZSA9PSBudWxsICkgcmV0dXJuIFwibnVsbFwiO1xuXHRpZiAoIHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIiApIHJldHVybiByZXBsYWNlciggdW5kZWZpbmVkLCBpc0Zpbml0ZSggdmFsdWUgKSA/IHZhbHVlLnRvU3RyaW5nKCkgOiBcIm51bGxcIiApO1xuXHRpZiAoIHR5cGVvZiB2YWx1ZSA9PT0gXCJib29sZWFuXCIgKSByZXR1cm4gcmVwbGFjZXIoIHVuZGVmaW5lZCwgdmFsdWUudG9TdHJpbmcoKSApO1xuXHRpZiAoIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIiApIHtcblxuXHRcdGlmICggdHlwZW9mIHZhbHVlWyB0b0pTT04gXSA9PT0gXCJmdW5jdGlvblwiICkgcmV0dXJuIHN0cmluZ2lmeSggcmVwbGFjZXIoIHVuZGVmaW5lZCwgdmFsdWVbIHRvSlNPTiBdKCkgKSwgcmVwbGFjZXIsIHRvSlNPTiApO1xuXHRcdGlmICggdHlwZW9mIHZhbHVlLnRvSlNPTiA9PT0gXCJmdW5jdGlvblwiICkgcmV0dXJuIHN0cmluZ2lmeSggcmVwbGFjZXIoIHVuZGVmaW5lZCwgdmFsdWUudG9KU09OKCkgKSwgcmVwbGFjZXIsIHRvSlNPTiApO1xuXG5cdFx0aWYgKCB0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIiApIHJldHVybiBcIlxcXCJcIiArIHZhbHVlLnRvU3RyaW5nKCkucmVwbGFjZSggZXNjUkUsIGVzY0Z1bmMgKSArIFwiXFxcIlwiO1xuXG5cdFx0aWYgKCBpc0FycmF5KCB2YWx1ZSApICkge1xuXG5cdFx0XHRsZXQgcmVzID0gXCJbXCI7XG5cblx0XHRcdGZvciAoIGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSArKyApXG5cdFx0XHRcdHJlcyArPSAoIGkgPyBcIiwgXCIgOiBcIlwiICkgKyBzdHJpbmdpZnkoIHJlcGxhY2VyLmNhbGwoIHZhbHVlLCBpLCB2YWx1ZVsgaSBdICksIHJlcGxhY2VyLCB0b0pTT04gKTtcblxuXHRcdFx0cmV0dXJuIHJlcyArIFwiXVwiO1xuXG5cdFx0fVxuXG5cdFx0Y29uc3QgdG1wID0gW107XG5cblx0XHRmb3IgKCBjb25zdCBwcm9wIGluIHZhbHVlIClcblx0XHRcdGlmICggdmFsdWUuaGFzT3duUHJvcGVydHkoIHByb3AgKSApXG5cdFx0XHRcdHRtcC5wdXNoKCBzdHJpbmdpZnkoIHJlcGxhY2VyLmNhbGwoIHZhbHVlLCBwcm9wLCBwcm9wICksIHJlcGxhY2VyLCB0b0pTT04gKSArIFwiOiBcIiArIHN0cmluZ2lmeSggcmVwbGFjZXIuY2FsbCggdmFsdWUsIHByb3AsIHZhbHVlWyBwcm9wIF0gKSwgcmVwbGFjZXIsIHRvSlNPTiApICk7XG5cblx0XHRyZXR1cm4gXCJ7XCIgKyB0bXAuam9pbiggXCIsIFwiICkgKyBcIn1cIjtcblxuXHR9XG5cblx0cmV0dXJuIFwiXFxcIlwiICsgdmFsdWUudG9TdHJpbmcoKS5yZXBsYWNlKCBlc2NSRSwgZXNjRnVuYyApICsgXCJcXFwiXCI7XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgc3RyaW5naWZ5O1xuIiwiXG5pbXBvcnQgeyBTZXJ2ZXIgfSBmcm9tIFwid3NcIjtcblxuaW1wb3J0IEV2ZW50RGlzcGF0Y2hlciBmcm9tIFwiLi4vLi4vLi4vY29yZS9FdmVudERpc3BhdGNoZXJcIjtcbmltcG9ydCBIYW5kbGUgZnJvbSBcIi4uLy4uLy4uL2NvcmUvSGFuZGxlXCI7XG5pbXBvcnQgQ29sbGVjdGlvbiBmcm9tIFwiLi4vLi4vLi4vY29yZS9Db2xsZWN0aW9uLmpzXCI7XG5pbXBvcnQgc3RyaW5naWZ5IGZyb20gXCIuLi8uLi8uLi9taXNjL3N0cmluZ2lmeS5qc1wiO1xuXG5jbGFzcyBTZXJ2ZXJOZXR3b3JrIGV4dGVuZHMgRXZlbnREaXNwYXRjaGVyIHtcblxuXHRjb25zdHJ1Y3RvciggcHJvcHMgPSB7fSApIHtcblxuXHRcdHN1cGVyKCk7XG5cblx0XHR0aGlzLmNsaWVudHMgPSBwcm9wcy5jbGllbnRzIHx8IG5ldyBDb2xsZWN0aW9uKCk7XG5cdFx0dGhpcy53cyA9IHByb3BzLndzICYmIHByb3BzLndzLmNvbnN0cnVjdG9yICE9PSBPYmplY3QgJiYgcHJvcHMud3MgfHwgdGhpcy5jcmVhdGVXUyggcHJvcHMgKTtcblxuXHRcdHRoaXMuY2hhcnNTZW50ID0gMDtcblxuXHRcdHNldEludGVydmFsKCAoKSA9PiB7XG5cblx0XHRcdGlmICggISB0aGlzLmNoYXJzU2VudCApIHJldHVybjtcblx0XHRcdC8vIGNvbnNvbGUubG9nKCB0aGlzLmNoYXJzU2VudCApO1xuXHRcdFx0dGhpcy5jaGFyc1NlbnQgPSAwO1xuXG5cdFx0fSwgMTAwMCApO1xuXG5cdH1cblxuXHRzZW5kKCBkYXRhLCB0b0pTT04gKSB7XG5cblx0XHRpZiAoIHR5cGVvZiBkYXRhID09PSBcIm9iamVjdFwiICkge1xuXG5cdFx0XHRpZiAoIHRoaXMuYXBwICkge1xuXG5cdFx0XHRcdGlmICggZGF0YSBpbnN0YW5jZW9mIEFycmF5ICkge1xuXG5cdFx0XHRcdFx0Zm9yICggbGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkgKysgKVxuXHRcdFx0XHRcdFx0aWYgKCBkYXRhWyBpIF0udGltZSA9PT0gdW5kZWZpbmVkICkgZGF0YVsgaSBdLnRpbWUgPSB0aGlzLmFwcC50aW1lO1xuXG5cdFx0XHRcdH0gZWxzZSBpZiAoIGRhdGEudGltZSA9PT0gdW5kZWZpbmVkICkgZGF0YS50aW1lID0gdGhpcy5hcHAudGltZTtcblxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIHRvSlNPTiApIGRhdGEgPSBzdHJpbmdpZnkoIGRhdGEsIHRoaXMucmVwbGFjZXIsIHRvSlNPTiApO1xuXHRcdFx0ZWxzZSBkYXRhID0gSlNPTi5zdHJpbmdpZnkoIGRhdGEsIHRoaXMucmVwbGFjZXIgKTtcblxuXHRcdH0gZWxzZSBpZiAoIHR5cGVvZiBkYXRhICE9PSBcInN0cmluZ1wiICkgZGF0YSA9IGRhdGEudG9TdHJpbmcoKTtcblxuXHRcdC8vIGlmICggdGhpcy5jbGllbnRzLmxlbmd0aCApXG5cdFx0Ly8gXHRjb25zb2xlLmxvZyggXCJTRU5EXCIsIGRhdGEgKTtcblxuXHRcdGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuY2xpZW50cy5sZW5ndGg7IGkgKysgKSB7XG5cblx0XHRcdHRyeSB7XG5cblx0XHRcdFx0dGhpcy5jbGllbnRzWyBpIF0uc2VuZCggZGF0YSApO1xuXG5cdFx0XHR9IGNhdGNoICggZXJyICkge31cblxuXHRcdFx0dGhpcy5jaGFyc1NlbnQgKz0gZGF0YS5sZW5ndGg7XG5cblx0XHR9XG5cblx0fVxuXG5cdGNyZWF0ZVdTKCBwcm9wcyA9IHt9ICkge1xuXG5cdFx0Y29uc3Qgd3MgPSBuZXcgU2VydmVyKCB7IHBvcnQ6IHByb3BzLnBvcnQgfHwgMzAwMCB9ICk7XG5cdFx0Y29uc29sZS5sb2coIFwiTGlzdGVuaW5nIG9uXCIsIHByb3BzLnBvcnQgfHwgMzAwMCApO1xuXG5cdFx0d3Mub24oIFwiY29ubmVjdGlvblwiLCBzb2NrZXQgPT4ge1xuXG5cdFx0XHRzb2NrZXQuaWQgPSAoIEhhbmRsZS5pZCApKys7XG5cdFx0XHRzb2NrZXQua2V5ID0gXCJjXCIgKyBzb2NrZXQuaWQ7XG5cdFx0XHR0aGlzLmNsaWVudHMuYWRkKCBzb2NrZXQgKTtcblx0XHRcdGNvbnNvbGUubG9nKCBcIkNvbm5lY3Rpb24gZnJvbVwiLCBzb2NrZXQuX3NvY2tldC5yZW1vdGVBZGRyZXNzLCBcIm9uXCIsIHNvY2tldC5fc29ja2V0LnJlbW90ZVBvcnQsIFwiYXNcIiwgc29ja2V0LmlkICk7XG5cblx0XHRcdHNvY2tldC5vbmNsb3NlID0gKCkgPT4ge1xuXG5cdFx0XHRcdHRoaXMuY2xpZW50cy5yZW1vdmUoIHNvY2tldCApO1xuXG5cdFx0XHRcdHRoaXMuYXBwLmRpc3BhdGNoRXZlbnQoIHsgdHlwZTogXCJjbGllbnRMZWF2ZVwiLCBjbGllbnQ6IHsgaWQ6IHNvY2tldC5pZCB9IH0gKTtcblxuXHRcdFx0fTtcblxuXHRcdFx0c29ja2V0Lm9ubWVzc2FnZSA9IGRhdGEgPT4ge1xuXG5cdFx0XHRcdC8vIElnbm9yZSBsYXJnZSBtZXNzYWdlc1xuXHRcdFx0XHRpZiAoIGRhdGEubGVuZ3RoID4gMTAwMCApIHJldHVybjtcblxuXHRcdFx0XHR0cnkge1xuXG5cdFx0XHRcdFx0ZGF0YSA9IEpTT04ucGFyc2UoIGRhdGEuZGF0YSwgdGhpcy5yZXZpdmVyICk7XG5cblx0XHRcdFx0fSBjYXRjaCAoIGVyciApIHtcblxuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoIFwiSW52YWxpZCBtZXNzYWdlIGZyb20gY2xpZW50XCIsIHNvY2tldC5rZXkgKTtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKCBcIk1heSBiZSBhIGJ1ZyBpbiB0aGUgY29kZSBvciBuZWZhcmlvdXMgYWN0aW9uXCIgKTtcblxuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGhpcy5hcHAuZGlzcGF0Y2hFdmVudCggeyB0eXBlOiBcImNsaWVudE1lc3NhZ2VcIiwgY2xpZW50OiB7IGlkOiBzb2NrZXQuaWQgfSwgbWVzc2FnZTogZGF0YSB9ICk7XG5cblx0XHRcdH07XG5cblx0XHRcdHRoaXMuYXBwLmRpc3BhdGNoRXZlbnQoIHsgdHlwZTogXCJjbGllbnRKb2luXCIsIGNsaWVudDogeyBpZDogc29ja2V0LmlkLCBzZW5kOiAoIGRhdGEsIHRvSlNPTiApID0+IHtcblxuXHRcdFx0XHRpZiAoIHR5cGVvZiBkYXRhID09PSBcIm9iamVjdFwiICkge1xuXG5cdFx0XHRcdFx0aWYgKCB0aGlzLmFwcCApIHtcblxuXHRcdFx0XHRcdFx0aWYgKCBkYXRhIGluc3RhbmNlb2YgQXJyYXkgKSB7XG5cblx0XHRcdFx0XHRcdFx0Zm9yICggbGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkgKysgKVxuXHRcdFx0XHRcdFx0XHRcdGlmICggZGF0YVsgaSBdLnRpbWUgPT09IHVuZGVmaW5lZCApIGRhdGFbIGkgXS50aW1lID0gdGhpcy5hcHAudGltZTtcblxuXHRcdFx0XHRcdFx0fSBlbHNlIGlmICggZGF0YS50aW1lID09PSB1bmRlZmluZWQgKSBkYXRhLnRpbWUgPSB0aGlzLmFwcC50aW1lO1xuXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKCB0b0pTT04gKSBkYXRhID0gc3RyaW5naWZ5KCBkYXRhLCB0aGlzLnJlcGxhY2VyLCB0b0pTT04gKTtcblx0XHRcdFx0XHRlbHNlIGRhdGEgPSBKU09OLnN0cmluZ2lmeSggZGF0YSwgdGhpcy5yZXBsYWNlciApO1xuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0cnkge1xuXG5cdFx0XHRcdFx0c29ja2V0LnNlbmQoIGRhdGEgKTtcblxuXHRcdFx0XHR9IGNhdGNoICggZXJyICkge31cblxuXHRcdFx0fSB9IH0gKTtcblxuXHRcdH0gKTtcblxuXHRcdHJldHVybiB3cztcblxuXHR9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgU2VydmVyTmV0d29yaztcbiIsIlxuZnVuY3Rpb24gcmVuZGVyZXIoKSB7XG5cblx0Y29uc3QgcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlciggeyBhbnRpYWxpYXM6IHRydWUgfSApO1xuXHRyZW5kZXJlci5zaGFkb3dNYXAuZW5hYmxlZCA9IHRydWU7XG5cdHJlbmRlcmVyLnNoYWRvd01hcC50eXBlID0gVEhSRUUuUENGU29mdFNoYWRvd01hcDtcblxuXHRyZW5kZXJlci5zZXRTaXplKCB3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0ICk7XG5cblx0aWYgKCBkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImNvbXBsZXRlXCIgfHwgZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gXCJsb2FkZWRcIiB8fCBkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImludGVyYWN0aXZlXCIgKVxuXHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIHJlbmRlcmVyICk7XG5cblx0ZWxzZSBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCBcIkRPTUNvbnRlbnRMb2FkZWRcIiwgKCkgPT4gZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggcmVuZGVyZXIuZG9tRWxlbWVudCApICk7XG5cblx0cmV0dXJuIHJlbmRlcmVyO1xuXG59XG5cbmV4cG9ydCBkZWZhdWx0IHJlbmRlcmVyO1xuIiwiXG5pbXBvcnQgRXZlbnREaXNwYXRjaGVyIGZyb20gXCIuLi9jb3JlL0V2ZW50RGlzcGF0Y2hlci5qc1wiO1xuXG5sZXQgcmVjdElkID0gMDtcblxuY2xhc3MgUmVjdCBleHRlbmRzIEV2ZW50RGlzcGF0Y2hlciB7XG5cblx0Y29uc3RydWN0b3IoIHAxLCBwMiwgeDIsIHkyLCBwcm9wcyA9IHt9ICkge1xuXG5cdFx0c3VwZXIoKTtcblxuXHRcdHRoaXMuaWQgPSByZWN0SWQgKys7XG5cblx0XHQvLyBQYXNzZWQgYXMgeDEsIHkxLCB4MiwgeTJcblx0XHRpZiAoIHR5cGVvZiBwMSA9PT0gXCJudW5iZXJcIiApIHtcblxuXHRcdFx0dGhpcy5taW5YID0gTWF0aC5taW4oIHAxLCB4MiApO1xuXHRcdFx0dGhpcy5tYXhYID0gTWF0aC5tYXgoIHAxLCB4MiApO1xuXHRcdFx0dGhpcy5taW5ZID0gTWF0aC5taW4oIHAyLCB5MiApO1xuXHRcdFx0dGhpcy5tYXhZID0gTWF0aC5tYXgoIHAyLCB5MiApO1xuXG5cdFx0Ly8gUGFzc2VkIGFzIHt4MSwgeTF9LCB7eDIsIHkyfVxuXG5cdFx0fSBlbHNlIGlmICggcDEueCAhPT0gdW5kZWZpbmVkICkge1xuXG5cdFx0XHR0aGlzLm1pblggPSBNYXRoLm1pbiggcDEueCwgcDIueCApO1xuXHRcdFx0dGhpcy5tYXhYID0gTWF0aC5tYXgoIHAxLngsIHAyLnggKTtcblx0XHRcdHRoaXMubWluWSA9IE1hdGgubWluKCBwMS55LCBwMi55ICk7XG5cdFx0XHR0aGlzLm1heFkgPSBNYXRoLm1heCggcDEueSwgcDIueSApO1xuXG5cdFx0XHRpZiAoIHgyICE9PSB1bmRlZmluZWQgKSBwcm9wcyA9IHgyO1xuXG5cdFx0Ly8gTm90IHBhc3NlZD9cblxuXHRcdH0gZWxzZSB7XG5cblx0XHRcdGlmICggcDEgIT09IHVuZGVmaW5lZCApIHByb3BzID0gcDE7XG5cblx0XHR9XG5cblx0XHRpZiAoIHByb3BzLnVuaXRFbnRlciApIHRoaXMuYWRkRXZlbnRMaXN0ZW5lciggXCJ1bml0RW50ZXJcIiwgcHJvcHMudW5pdEVudGVyICk7XG5cdFx0aWYgKCBwcm9wcy51bml0TGVhdmUgKSB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoIFwidW5pdExlYXZlXCIsIHByb3BzLnVuaXRMZWF2ZSApO1xuXG5cdFx0T2JqZWN0LmFzc2lnbiggdGhpcywgeyB1bml0czogW10gfSwgcHJvcHMgKTtcblxuXHR9XG5cblx0Z2V0IGtleSgpIHtcblxuXHRcdHJldHVybiBcInJcIiArIHRoaXMuaWQ7XG5cblx0fVxuXG5cdGFkZEV2ZW50TGlzdGVuZXIoIHR5cGUsIC4uLmFyZ3MgKSB7XG5cblx0XHRpZiAoICggdHlwZSA9PT0gXCJ1bml0RW50ZXJcIiB8fCB0eXBlID09PSBcInVuaXRMZWF2ZVwiICkgJiYgKCAhIHRoaXMuX2xpc3RlbmVycy51bml0RW50ZXIgfHwgISB0aGlzLl9saXN0ZW5lcnMudW5pdEVudGVyLmxlbmd0aCApICYmICggISB0aGlzLl9saXN0ZW5lcnMudW5pdExlYXZlIHx8ICEgdGhpcy5fbGlzdGVuZXJzLnVuaXRMZWF2ZS5sZW5ndGggKSApXG5cdFx0XHR0aGlzLmRpc3BhdGNoRXZlbnQoIHsgdHlwZTogXCJkaXJ0eVwiIH0gKTtcblxuXHRcdHN1cGVyLmFkZEV2ZW50TGlzdGVuZXIoIHR5cGUsIC4uLmFyZ3MgKTtcblxuXHR9XG5cblx0Ly8gUmV0dXJucyB0cnVlIGlmIGEgcG9pbnQtbGlrZSBvYmplY3QgKHdpdGggLnggYW5kIC55KSBpcyBjb250YWluZWQgYnkgdGhlIHJlY3Rcblx0Y29udGFpbnMoIHBvaW50ICkge1xuXG5cdFx0aWYgKCBwb2ludC54ID09PSB1bmRlZmluZWQgfHwgcG9pbnQueSA9PT0gdW5kZWZpbmVkICkgcmV0dXJuO1xuXG5cdFx0cmV0dXJuIHBvaW50LnggPD0gdGhpcy5tYXhYICYmIHBvaW50LnggPj0gdGhpcy5taW5YICYmIHBvaW50LnkgPD0gdGhpcy5tYXhZICYmIHBvaW50LnkgPj0gdGhpcy5taW5ZO1xuXG5cdH1cblxuXHRnZXQgYXJlYSgpIHtcblxuXHRcdHJldHVybiAoIHRoaXMubWF4WCAtIHRoaXMubWluWCApICogKCB0aGlzLm1heFkgLSB0aGlzLm1pblkgKTtcblxuXHR9XG5cblx0X2RpZmZPcHRpbWl6ZWQoIHNldEEsIHNldEIsIHByb3AgKSB7XG5cblx0XHRjb25zdCBhVW5pcXVlID0gW10sXG5cdFx0XHRiVW5pcXVlID0gW10sXG5cdFx0XHRzaGFyZWQgPSBbXTtcblxuXHRcdGZvciAoIGxldCBpID0gMCwgbiA9IDA7IGkgPCBzZXRBLmxlbmd0aCAmJiBuIDwgc2V0Qi5sZW5ndGg7ICkge1xuXG5cdFx0XHRpZiAoIHNldEFbIGkgXVsgcHJvcCBdIDwgc2V0QlsgbiBdWyBwcm9wIF0gKSB7XG5cblx0XHRcdFx0YVVuaXF1ZS5wdXNoKCBzZXRBWyBpIF0gKTtcblx0XHRcdFx0aSArKztcblxuXHRcdFx0fSBlbHNlIGlmICggc2V0QVsgaSBdWyBwcm9wIF0gPiBzZXRCWyBuIF1bIHByb3AgXSApIHtcblxuXHRcdFx0XHRiVW5pcXVlLnB1c2goIHNldEJbIG4gXSApO1xuXHRcdFx0XHRuICsrO1xuXG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdHNoYXJlZC5wdXNoKCBzZXRBWyBpIF0gKTtcblx0XHRcdFx0aSArKzsgbiArKztcblxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIHNldEFbIGkgXSA9PT0gdW5kZWZpbmVkICYmIG4gPCBzZXRCLmxlbmd0aCApIGJVbmlxdWUucHVzaCggLi4uc2V0Qi5zbGljZSggbiApICk7XG5cdFx0XHRpZiAoIHNldEJbIG4gXSA9PT0gdW5kZWZpbmVkICYmIGkgPCBzZXRBLmxlbmd0aCApIGFVbmlxdWUucHVzaCggLi4uc2V0QS5zbGljZSggaSApICk7XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gWyBhVW5pcXVlLCBiVW5pcXVlLCBzaGFyZWQgXTtcblxuXHR9XG5cblx0Ly8gQXNzdW1lcyBvcmRlcmVkXG5cdGRpZmYoIHNldEEsIHNldEIsIGNvbXBhcmUgKSB7XG5cblx0XHRpZiAoIHNldEEubGVuZ3RoID09PSAwICkgcmV0dXJuIFtbXSwgc2V0Qi5zbGljZSggMCApLCBbXV07XG5cdFx0aWYgKCBzZXRCLmxlbmd0aCA9PT0gMCApIHJldHVybiBbIHNldEEuc2xpY2UoIDAgKSwgW10sIFtdXTtcblxuXHRcdGlmICggdHlwZW9mIGNvbXBhcmUgIT09IFwiZnVuY3Rpb25cIiApIHJldHVybiB0aGlzLl9kaWZmT3B0aW1pemVkKCBzZXRBLCBzZXRCLCBjb21wYXJlICk7XG5cblx0XHRjb25zdCBhVW5pcXVlID0gW10sXG5cdFx0XHRiVW5pcXVlID0gW10sXG5cdFx0XHRzaGFyZWQgPSBbXTtcblxuXHRcdGZvciAoIGxldCBpID0gMCwgbiA9IDA7IGkgPCBzZXRBLmxlbmd0aCB8fCBuIDwgc2V0Qi5sZW5ndGg7ICkge1xuXG5cdFx0XHRjb25zdCByZWxhdGlvbiA9IGNvbXBhcmUoIHNldEFbIGkgXSwgc2V0QlsgaSBdICk7XG5cblx0XHRcdGlmICggcmVsYXRpb24gPCAwICkge1xuXG5cdFx0XHRcdGFVbmlxdWUucHVzaCggc2V0QVsgaSBdICk7XG5cdFx0XHRcdGkgKys7XG5cblx0XHRcdH0gZWxzZSBpZiAoIHJlbGF0aW9uID4gMCApIHtcblxuXHRcdFx0XHRiVW5pcXVlLnB1c2goIHNldEJbIG4gXSApO1xuXHRcdFx0XHRuICsrO1xuXG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdHNoYXJlZC5wdXNoKCBzZXRBWyBpIF0gKTtcblx0XHRcdFx0aSArKzsgbiArKztcblxuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdFx0cmV0dXJuIFsgYVVuaXF1ZSwgYlVuaXF1ZSwgc2hhcmVkIF07XG5cblx0fVxuXG5cdGNhbGN1bGF0ZUVudGVyKCBvYmogKSB7XG5cblx0XHQvLyBBbHNvLCBjaGVjayB3aGVuIHRoZSBzaGFkb3dQcm9wcyB3ZXJlIGRlZmluZWQgKHN0YXJ0KVxuXHRcdGlmICggb2JqLnNoYWRvd1Byb3BzID09PSB1bmRlZmluZWQgfHwgKCB0eXBlb2Ygb2JqLnNoYWRvd1Byb3BzLnggIT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2Ygb2JqLnNoYWRvd1Byb3BzLnkgIT09IFwiZnVuY3Rpb25cIiApIClcblx0XHRcdHJldHVybiBOYU47XG5cblx0XHRpZiAoIG9iai5zaGFkb3dQcm9wcy54ICE9PSBcImZ1bmN0aW9uXCIgKSB7XG5cblx0XHRcdGlmICggb2JqLnNoYWRvd1Byb3BzLnkucmF0ZSA8IDAgKSByZXR1cm4gb2JqLnNoYWRvd1Byb3BzLnkuc2VlayggdGhpcy5tYXhZICk7XG5cdFx0XHRyZXR1cm4gb2JqLnNoYWRvd1Byb3BzLnkuc2VlayggdGhpcy5taW5ZICk7XG5cblx0XHR9IGVsc2UgaWYgKCBvYmouc2hhZG93UHJvcHMueSAhPT0gXCJmdW5jdGlvblwiICkge1xuXG5cdFx0XHRpZiAoIG9iai5zaGFkb3dQcm9wcy54LnJhdGUgPCAwICkgcmV0dXJuIG9iai5zaGFkb3dQcm9wcy54LnNlZWsoIHRoaXMubWF4WCApO1xuXHRcdFx0cmV0dXJuIG9iai5zaGFkb3dQcm9wcy54LnNlZWsoIHRoaXMubWluWCApO1xuXG5cdFx0fVxuXG5cdFx0Y29uc3QgeERlbHRhID0gb2JqLnNoYWRvd1Byb3BzLngucmF0ZSA8IDAgPyBNYXRoLmFicyggb2JqLnggLSB0aGlzLm1heFggKSA6IE1hdGguYWJzKCBvYmoueCAtIHRoaXMubWluWCApLFxuXHRcdFx0eURlbHRhID0gb2JqLnNoYWRvd1Byb3BzLnkucmF0ZSA8IDAgPyBNYXRoLmFicyggb2JqLnkgLSB0aGlzLm1heFkgKSA6IE1hdGguYWJzKCBvYmoueSAtIHRoaXMubWluWSApO1xuXG5cdFx0cmV0dXJuIHhEZWx0YSA8IHlEZWx0YSA/XG5cdFx0XHRvYmouc2hhZG93UHJvcHMueC5zZWVrKCBvYmouc2hhZG93UHJvcHMueC5yYXRlIDwgMCA/IHRoaXMubWF4WCA6IHRoaXMubWluWCApIDpcblx0XHRcdG9iai5zaGFkb3dQcm9wcy55LnNlZWsoIG9iai5zaGFkb3dQcm9wcy55LnJhdGUgPCAwID8gdGhpcy5tYXhZIDogdGhpcy5taW5ZICk7XG5cblx0fVxuXG5cdGNhbGN1bGF0ZUxlYXZlKCBvYmogKSB7XG5cblx0XHQvLyBBbHNvLCBjaGVjayB3aGVuIHRoZSBzaGFkb3dQcm9wcyB3ZXJlIGRlZmluZWQgKHN0YXJ0KVxuXHRcdGlmICggb2JqLnNoYWRvd1Byb3BzID09PSB1bmRlZmluZWQgfHwgKCB0eXBlb2Ygb2JqLnNoYWRvd1Byb3BzLnggIT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2Ygb2JqLnNoYWRvd1Byb3BzLnkgIT09IFwiZnVuY3Rpb25cIiApICkge1xuXG5cdFx0XHRpZiAoIHRoaXMuYXBwICkgcmV0dXJuIHRoaXMuYXBwLnRpbWU7XG5cdFx0XHRyZXR1cm4gTmFOO1xuXG5cdFx0fVxuXG5cdFx0aWYgKCB0eXBlb2Ygb2JqLnNoYWRvd1Byb3BzLnggIT09IFwiZnVuY3Rpb25cIiApIHtcblxuXHRcdFx0aWYgKCBvYmouc2hhZG93UHJvcHMueS5yYXRlIDwgMCApIHJldHVybiBvYmouc2hhZG93UHJvcHMueS5zZWVrKCB0aGlzLm1pblkgKTtcblx0XHRcdHJldHVybiBvYmouc2hhZG93UHJvcHMueS5zZWVrKCB0aGlzLm1heFkgKTtcblxuXHRcdH0gZWxzZSBpZiAoIHR5cGVvZiBvYmouc2hhZG93UHJvcHMueSAhPT0gXCJmdW5jdGlvblwiICkge1xuXG5cdFx0XHRpZiAoIG9iai5zaGFkb3dQcm9wcy54LnJhdGUgPCAwICkgcmV0dXJuIG9iai5zaGFkb3dQcm9wcy54LnNlZWsoIHRoaXMubWluWCApO1xuXHRcdFx0cmV0dXJuIG9iai5zaGFkb3dQcm9wcy54LnNlZWsoIHRoaXMubWF4WCApO1xuXG5cdFx0fVxuXG5cdFx0Y29uc3QgeERlbHRhID0gb2JqLnNoYWRvd1Byb3BzLngucmF0ZSA8IDAgPyBNYXRoLmFicyggb2JqLnggLSB0aGlzLm1pblggKSA6IE1hdGguYWJzKCBvYmoueCAtIHRoaXMubWF4WCApLFxuXHRcdFx0eURlbHRhID0gb2JqLnNoYWRvd1Byb3BzLnkucmF0ZSA8IDAgPyBNYXRoLmFicyggb2JqLnkgLSB0aGlzLm1pblkgKSA6IE1hdGguYWJzKCBvYmoueSAtIHRoaXMubWF4WSApO1xuXG5cdFx0cmV0dXJuIHhEZWx0YSA8IHlEZWx0YSA/XG5cdFx0XHRvYmouc2hhZG93UHJvcHMueC5zZWVrKCBvYmouc2hhZG93UHJvcHMueC5yYXRlIDwgMCA/IHRoaXMubWluWCA6IHRoaXMubWF4WCApIDpcblx0XHRcdG9iai5zaGFkb3dQcm9wcy55LnNlZWsoIG9iai5zaGFkb3dQcm9wcy55LnJhdGUgPCAwID8gdGhpcy5taW5ZIDogdGhpcy5tYXhZICk7XG5cblx0fVxuXG5cdHRvSlNPTigpIHtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRfa2V5OiB0aGlzLmtleSxcblx0XHRcdF9jb2xsZWN0aW9uOiBcInJlY3RzXCJcblx0XHR9O1xuXG5cdH1cblxuXHR1cGRhdGUoKSB7XG5cblx0XHRpZiAoICEgdGhpcy5hcmVhICkgcmV0dXJuO1xuXG5cdFx0bGV0IHVuaXRzO1xuXG5cdFx0aWYgKCB0aGlzLnRlcnJhaW4gKSB1bml0cyA9IHRoaXMudGVycmFpbi5zZWxlY3RVbml0c0JvdW5kZWRCeVJlY3RhbmdsZSggdGhpcyApO1xuXHRcdGVsc2UgaWYgKCB0aGlzLmFwcCAmJiB0aGlzLmFwcC50ZXJyYWluICkgdW5pdHMgPSB0aGlzLmFwcC50ZXJyYWluLnNlbGVjdFVuaXRzQm91bmRlZEJ5UmVjdGFuZ2xlKCB0aGlzICk7XG5cdFx0ZWxzZSBpZiAoIHRoaXMuY2FuZGlkYXRlVW5pdHMgKSB1bml0cyA9IHRoaXMuY2FuZGlkYXRlVW5pdHMuZmlsdGVyKCB1bml0ID0+IHRoaXMuY29udGFpbnMoIHVuaXQgKSApO1xuXHRcdGVsc2UgcmV0dXJuIGNvbnNvbGUuZXJyb3IoIFwiTm8gc291cmNlIG9mIHVuaXRzLlwiICk7XG5cblx0XHR1bml0cy5zb3J0KCAoIGEsIGIgKSA9PiBhLmlkID4gYi5pZCApO1xuXG5cdFx0Y29uc3QgWyBlbnRlcnMsIGxlYXZlcyBdID0gdGhpcy5kaWZmKCB1bml0cywgdGhpcy51bml0cywgXCJpZFwiICk7XG5cblx0XHQvLyBjb25zb2xlLmxvZyggdGhpcy51bml0cy5sZW5ndGgsIHVuaXRzLmxlbmd0aCwgZW50ZXJzLmxlbmd0aCwgbGVhdmVzLmxlbmd0aCwgc2FtZS5sZW5ndGggKTtcblxuXHRcdHRoaXMudW5pdHMgPSB1bml0cztcblxuXHRcdGlmICggZW50ZXJzLmxlbmd0aCA9PT0gMCAmJiBsZWF2ZXMubGVuZ3RoID09PSAwICkgcmV0dXJuO1xuXG5cdFx0Ly8gY29uc29sZS5sb2coIGVudGVycy5yZWR1Y2UoICggY29sLCB1ICkgPT4gKCBjb2xbIHUuY29uc3RydWN0b3IubmFtZSBdID8gKysgY29sWyB1LmNvbnN0cnVjdG9yLm5hbWUgXSA6IGNvbFsgdS5jb25zdHJ1Y3Rvci5uYW1lIF0gPSAxLCBjb2wgKSwge30gKSxcblx0XHQvLyBcdGxlYXZlcy5yZWR1Y2UoICggY29sLCB1ICkgPT4gKCBjb2xbIHUuY29uc3RydWN0b3IubmFtZSBdID8gKysgY29sWyB1LmNvbnN0cnVjdG9yLm5hbWUgXSA6IGNvbFsgdS5jb25zdHJ1Y3Rvci5uYW1lIF0gPSAxLCBjb2wgKSwge30gKSApO1xuXG5cdFx0Y29uc3Qgc3ViZXZlbnRzID0gW107XG5cblx0XHRmb3IgKCBsZXQgaSA9IDA7IGkgPCBlbnRlcnMubGVuZ3RoOyBpICsrIClcblx0XHRcdHN1YmV2ZW50cy5wdXNoKCB7IHR5cGU6IFwidW5pdEVudGVyXCIsIHVuaXQ6IGVudGVyc1sgaSBdLCB0aW1lOiB0aGlzLmNhbGN1bGF0ZUVudGVyKCBlbnRlcnNbIGkgXSApLCB0YXJnZXQ6IHRoaXMgfSApO1xuXG5cdFx0Zm9yICggbGV0IGkgPSAwOyBpIDwgbGVhdmVzLmxlbmd0aDsgaSArKyApXG5cdFx0XHRzdWJldmVudHMucHVzaCggeyB0eXBlOiBcInVuaXRMZWF2ZVwiLCB1bml0OiBsZWF2ZXNbIGkgXSwgdGltZTogdGhpcy5jYWxjdWxhdGVMZWF2ZSggbGVhdmVzWyBpIF0gKSwgdGFyZ2V0OiB0aGlzIH0gKTtcblxuXHRcdGlmICggdGhpcy5hcHAgKSByZXR1cm4gdGhpcy5hcHAuc3ViZXZlbnRzLnB1c2goIC4uLnN1YmV2ZW50cyApO1xuXG5cdFx0c3ViZXZlbnRzLnNvcnQoICggYSwgYiApID0+IGEudGltZSAtIGIudGltZSApO1xuXG5cdFx0Zm9yICggbGV0IGkgPSAwOyBpIDwgc3ViZXZlbnRzLmxlbmd0aDsgaSArKyApXG5cdFx0XHR0aGlzLmRpc3BhdGNoRXZlbnQoIHN1YmV2ZW50c1sgaSBdICk7XG5cblx0fVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IFJlY3Q7XG4iLCJcbmNvbnN0IHN0cmluZ2lmeSA9IHZhbHVlID0+IHZhbHVlID09PSBJbmZpbml0eSA/IFwiX19JbmZpbml0eVwiIDogdmFsdWUgPT09IC0gSW5maW5pdHkgPyBcIl9fLUluZmluaXR5XCIgOiB2YWx1ZTtcbmNvbnN0IHBhcnNlID0gdmFsdWUgPT4gdmFsdWUgPT09IFwiX19JbmZpbml0eVwiID8gSW5maW5pdHkgOiB2YWx1ZSA9PT0gXCJfXy1JbmZpbml0eVwiID8gLSBJbmZpbml0eSA6IHZhbHVlO1xuXG5mdW5jdGlvbiBsaW5lYXJUd2VlbiggeyBzdGFydCA9IDAsIGVuZCA9IDEsIHJhdGUsIGR1cmF0aW9uLCBzdGFydFRpbWUgPSBEYXRlLm5vdygpIH0gPSB7fSApIHtcblxuXHQvLyBjb25zb2xlLmxvZyggXCJsaW5lYXJUd2VlblwiICk7XG5cblx0aWYgKCB0eXBlb2YgZHVyYXRpb24gPT09IFwic3RyaW5nXCIgKSBkdXJhdGlvbiA9IHBhcnNlKCBkdXJhdGlvbiApO1xuXG5cdGNvbnN0IGRpZmYgPSBlbmQgLSBzdGFydDtcblxuXHRpZiAoIHJhdGUgPT09IHVuZGVmaW5lZCApIHtcblxuXHRcdGlmICggZHVyYXRpb24gPT09IEluZmluaXR5ICkgcmF0ZSA9IDE7XG5cdFx0ZWxzZSByYXRlID0gZGlmZiAvIGR1cmF0aW9uO1xuXG5cdH1cblxuXHRpZiAoIGR1cmF0aW9uID09PSB1bmRlZmluZWQgKSBkdXJhdGlvbiA9IGRpZmYgLyByYXRlO1xuXG5cdGNvbnN0IGZ1bmMgPSAoIHRpbWUgPSBEYXRlLm5vdygpICkgPT4ge1xuXG5cdFx0Y29uc3QgZGVsdGEgPSAoIHRpbWUgLSBzdGFydFRpbWUgKSAvIDEwMDA7XG5cblx0XHRpZiAoIGRlbHRhID49IGR1cmF0aW9uICkgcmV0dXJuIGVuZDtcblxuXHRcdHJldHVybiBzdGFydCArIGRlbHRhICogcmF0ZTtcblxuXHR9O1xuXG5cdE9iamVjdC5hc3NpZ24oIGZ1bmMsIHtcblx0XHRzdGFydCwgZW5kLCByYXRlLCBkdXJhdGlvbiwgc3RhcnRUaW1lLCBkaWZmLFxuXHRcdHNlZWs6IHZhbHVlID0+ICggdmFsdWUgLSBzdGFydCApIC8gcmF0ZSAqIDEwMDAgKyBzdGFydFRpbWUsXG5cdFx0dG9TdGF0ZTogKCkgPT4gKCB7IF9mdW5jdGlvbjogXCJsaW5lYXJUd2VlblwiLCBzdGFydCwgZW5kLCByYXRlLCBkdXJhdGlvbjogc3RyaW5naWZ5KCBkdXJhdGlvbiApLCBzdGFydFRpbWUgfSApXG5cdH0gKTtcblxuXHRyZXR1cm4gZnVuYztcblxufVxuXG5leHBvcnQgZGVmYXVsdCBsaW5lYXJUd2VlbjtcbiIsIlxuLy8gQWN0dWFsbHkgdXNlZCBieSBBcHBcblxuaW1wb3J0IENvbGxlY3Rpb24gZnJvbSBcIi4vQ29sbGVjdGlvbi5qc1wiO1xuaW1wb3J0IEV2ZW50RGlzcGF0Y2hlciBmcm9tIFwiLi9FdmVudERpc3BhdGNoZXIuanNcIjtcbmltcG9ydCBQbGF5ZXIgZnJvbSBcIi4vUGxheWVyLmpzXCI7XG5pbXBvcnQgdGltZVByb3BlcnR5IGZyb20gXCIuL3RpbWVQcm9wZXJ0eS5qc1wiO1xuXG5pbXBvcnQgbW9kZWxzIGZyb20gXCIuLi9lbnRpdGllcy9tb2RlbHMuanNcIjtcbmltcG9ydCBUZXJyYWluIGZyb20gXCIuLi9lbnRpdGllcy9UZXJyYWluLmpzXCI7XG5pbXBvcnQgVW5pdCBmcm9tIFwiLi4vZW50aXRpZXMvVW5pdC5qc1wiO1xuaW1wb3J0IERvb2RhZCBmcm9tIFwiLi4vZW50aXRpZXMvRG9vZGFkLmpzXCI7XG5pbXBvcnQgKiBhcyBlbnYgZnJvbSBcIi4uL21pc2MvZW52LmpzXCI7XG5pbXBvcnQgZmV0Y2hGaWxlIGZyb20gXCIuLi9taXNjL2ZldGNoRmlsZS5qc1wiO1xuXG5pbXBvcnQgUmFuZG9tIGZyb20gXCIuLi8uLi9saWIvc2VlZHJhbmRvbS1hbGVhLmpzXCI7XG5cbmltcG9ydCAqIGFzIHJ0cyBmcm9tIFwiLi4vcHJlc2V0cy9ydHMuanNcIjtcblxuLy8gV3JhcHBlZCBieSBBcHBcbmltcG9ydCBSZWN0IGZyb20gXCIuLi9taXNjL1JlY3QuanNcIjtcbmltcG9ydCAqIGFzIHR3ZWVucyBmcm9tIFwiLi4vdHdlZW5zL3R3ZWVucy5qc1wiO1xuXG5jb25zdCBldmFsMiA9IGV2YWw7XG5cbmNsYXNzIEFwcCBleHRlbmRzIEV2ZW50RGlzcGF0Y2hlciB7XG5cblx0Y29uc3RydWN0b3IoIHByb3BzID0ge30gKSB7XG5cblx0XHRzdXBlcigpO1xuXG5cdFx0dGhpcy5zdGF0ZSA9IHt9O1xuXG5cdFx0Ly8gVGltZSBrZWVwaW5nXG5cdFx0dGhpcy50aW1lID0gMDtcblx0XHR0aGlzLnJlbmRlclRpbWUgPSAwO1xuXHRcdHRoaXMubGFzdE5vdyA9IERhdGUubm93KCk7XG5cdFx0dGhpcy5sYXN0UmVuZGVyID0gdGhpcy5sYXN0Tm93O1xuXG5cdFx0Ly8gUmFuZG9tbmVzc1xuXHRcdHRoaXMuaW5pdGlhbFNlZWQgPSBwcm9wcy5zZWVkIHx8IFwid2ViY3JhZnRcIjtcblx0XHR0aW1lUHJvcGVydHkoIHRoaXMsIHRoaXMsIFwicmFuZG9tXCIsIHRydWUgKTtcblx0XHR0aGlzLnJhbmRvbSA9IG5ldyBSYW5kb20oIHRoaXMuaW5pdGlhbFNlZWQgKTtcblxuXHRcdC8vIENvbGxlY3Rpb25zICYgQXJyYXlzXG5cdFx0dGhpcy5oYW5kbGVzID0gcHJvcHMuaGFuZGxlcyB8fCBuZXcgQ29sbGVjdGlvbigpO1xuXHRcdHRoaXMucGxheWVycyA9IHByb3BzLnBsYXllcnMgfHwgbmV3IENvbGxlY3Rpb24oKTtcblx0XHR0aGlzLnVuaXRzID0gcHJvcHMudW5pdHMgfHwgbmV3IENvbGxlY3Rpb24oKTtcblx0XHR0aGlzLmRvb2RhZHMgPSBwcm9wcy5kb29kYWRzIHx8IG5ldyBDb2xsZWN0aW9uKCk7XG5cdFx0dGhpcy5yZWN0cyA9IHByb3BzLnJlY3RzIHx8IG5ldyBDb2xsZWN0aW9uKCk7XG5cdFx0dGhpcy51cGRhdGVzID0gcHJvcHMudXBkYXRlcyB8fCBuZXcgQ29sbGVjdGlvbigpO1xuXHRcdHRoaXMucmVuZGVycyA9IHByb3BzLnJlbmRlcnMgfHwgbmV3IENvbGxlY3Rpb24oKTtcblx0XHR0aGlzLnN1YmV2ZW50cyA9IHByb3BzLnN1YmV2ZW50cyB8fCBbXTtcblxuXHRcdGlmICggZW52LmlzU2VydmVyICkgT2JqZWN0LmRlZmluZVByb3BlcnR5KCB0aGlzLCBcIm9mZmljaWFsVGltZVwiLCB7IGdldDogKCkgPT4gdGhpcy50aW1lIH0gKTtcblxuXHRcdC8vIEluaXRpYWxpemUgdGhlIGFwcCBjb21wb25lbnRzXG5cdFx0dGhpcy5pbml0VGVycmFpbiggcHJvcHMudGVycmFpbiApO1xuXHRcdHRoaXMuaW5pdFNjZW5lKCBwcm9wcy5zY2VuZSApO1xuXHRcdHRoaXMuZXZlbnRTeXN0ZW0gPSBPYmplY3QuYXNzaWduKCB7fSwgcnRzLmV2ZW50U3lzdGVtLCBwcm9wcy5ldmVudFN5c3RlbSApO1xuXHRcdHRoaXMuaW5pdEZhY3RvcmllcyggcHJvcHMudHlwZXMgKTtcblx0XHR0aGlzLmluaXROZXR3b3JrKCBwcm9wcy5uZXR3b3JrICk7XG5cblx0XHQvLyBJbml0aWFsemUgdGhlIGFwcCBicm93c2VyIGNvbXBvbmVudHMgKGdyYXBoaWNzLCB1aSwgaW50ZW50cylcblx0XHRpZiAoIGVudi5pc0Jyb3dzZXIgKSB0aGlzLmluaXRCcm93c2VyQ29tcG9uZW50cyggcHJvcHMgKTtcblxuXHRcdC8vIFN0YXJ0IG91ciBwcmltYXJ5IGxvb3Bcblx0XHRpZiAoIGVudi5pc1NlcnZlciApIHRoaXMudXBkYXRlKCk7XG5cdFx0aWYgKCBlbnYuaXNCcm93c2VyICkgdGhpcy5yZW5kZXIoKTtcblxuXHR9XG5cblx0aW5pdFRlcnJhaW4oIHByb3BzICkge1xuXG5cdFx0dGhpcy50ZXJyYWluID0gcHJvcHMgJiYgcHJvcHMuY29uc3RydWN0b3IgIT09IE9iamVjdCA/IHByb3BzIDogbmV3IFRlcnJhaW4oIE9iamVjdC5hc3NpZ24oIHsgYXBwOiB0aGlzIH0sIHByb3BzICkgKTtcblxuXHR9XG5cblx0aW5pdEludGVudFN5c3RlbSggcHJvcHMgKSB7XG5cblx0XHR0aGlzLmludGVudFN5c3RlbSA9IHByb3BzICYmIHByb3BzLmNvbnN0cnVjdG9yICE9PSBPYmplY3QgPyBwcm9wcyA6IHt9O1xuXG5cdH1cblxuXHRpbml0U2NlbmUoIHByb3BzICkge1xuXG5cdFx0dGhpcy5zY2VuZSA9IHByb3BzICYmIHByb3BzIGluc3RhbmNlb2YgVEhSRUUuU2NlbmUgP1xuXHRcdFx0cHJvcHMgOlxuXHRcdFx0bmV3IFRIUkVFLlNjZW5lKCk7XG5cblx0XHQvLyB0aGlzLmdsb2JhbExpZ2h0ID0gbmV3IFRIUkVFLkhlbWlzcGhlcmVMaWdodCggMHhmZmZmYmIsIDB4MDgwODIwICk7XG5cdFx0dGhpcy5nbG9iYWxMaWdodCA9IG5ldyBUSFJFRS5IZW1pc3BoZXJlTGlnaHQoIDB4ZmZmZmJiLCAweDA4MDgyMCApO1xuXHRcdHRoaXMuc2NlbmUuYWRkKCB0aGlzLmdsb2JhbExpZ2h0ICk7XG5cblx0XHR0aGlzLnN1biA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KCAweGZmZmZmZiwgMC41ICk7XG5cdFx0dGhpcy5zdW4ucG9zaXRpb24ueiA9IDU7XG5cdFx0dGhpcy5zdW4ucG9zaXRpb24ueCA9IC0gMztcblx0XHR0aGlzLnN1bi5wb3NpdGlvbi55ID0gLSA3O1xuXHRcdHRoaXMuc2NlbmUuYWRkKCB0aGlzLnN1biApO1xuXG5cdH1cblxuXHRpbml0QnJvd3NlckNvbXBvbmVudHMoIHByb3BzICkge1xuXG5cdFx0dGhpcy5pbnRlbnRTeXN0ZW0gPSBPYmplY3QuYXNzaWduKCB7fSwgcHJvcHMuaW50ZW50U3lzdGVtICk7XG5cblx0XHR0aGlzLmluaXRDYW1lcmEoIHByb3BzLmNhbWVyYSApO1xuXHRcdHRoaXMucmVuZGVyZXIgPSBwcm9wcy5yZW5kZXJlciAmJiBwcm9wcy5yZW5kZXJlci5jb25zdHJ1Y3RvciAhPT0gT2JqZWN0ID8gcHJvcHMucmVuZGVyZXIgOiBydHMucmVuZGVyZXIoIHByb3BzLnJlbmRlcmVyICk7XG5cblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggXCJyZXNpemVcIiwgKCkgPT4gdGhpcy5jYW1lcmEucmVzaXplKCkgKTtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggXCJrZXlkb3duXCIsIGUgPT4gdGhpcy5pbnRlbnRTeXN0ZW0ua2V5ZG93biAmJiB0aGlzLmludGVudFN5c3RlbS5rZXlkb3duKCBlICkgKTtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggXCJrZXl1cFwiLCBlID0+IHRoaXMuaW50ZW50U3lzdGVtLmtleXVwICYmIHRoaXMuaW50ZW50U3lzdGVtLmtleXVwKCBlICkgKTtcblxuXHR9XG5cblx0aW5pdENhbWVyYSggcHJvcHMgKSB7XG5cblx0XHR0aGlzLmNhbWVyYSA9IHByb3BzICYmIHByb3BzIGluc3RhbmNlb2YgVEhSRUUuQ2FtZXJhID9cblx0XHRcdHByb3BzIDpcblx0XHRcdG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSggNTAsIHdpbmRvdy5pbm5lcldpZHRoIC8gd2luZG93LmlubmVySGVpZ2h0LCAwLjEsIDEwMDAwICk7XG5cblx0XHQvLyB0aGlzLmNhbWVyYS5yZXNpemUgPSAoKSA9PiB0aGlzLmNhbWVyYS5hc3BlY3QgPSB3aW5kb3cuaW5uZXJXaWR0aCAvIHdpbmRvdy5pbm5lckhlaWdodDtcblx0XHR0aGlzLmNhbWVyYS5yZXNpemUgPSAoKSA9PiB7XG5cblx0XHRcdHRoaXMuY2FtZXJhLmFzcGVjdCA9IHdpbmRvdy5pbm5lcldpZHRoIC8gd2luZG93LmlubmVySGVpZ2h0O1xuXHRcdFx0dGhpcy5jYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xuXG5cdFx0XHR0aGlzLnJlbmRlcmVyLnNldFNpemUoIHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQgKTtcblxuXHRcdH07XG5cblx0XHR0aGlzLmNhbWVyYS5wb3NpdGlvbi56ID0gMjU7XG5cblx0fVxuXG5cdGluaXROZXR3b3JrKCBwcm9wcyA9IHt9ICkge1xuXG5cdFx0aWYgKCBwcm9wcy5yZXZpdmVyID09PSB1bmRlZmluZWQgKVxuXHRcdFx0cHJvcHMucmV2aXZlciA9ICgga2V5LCB2YWx1ZSApID0+IHtcblxuXHRcdFx0XHQvLyBpZiAoIGtleSB8fCB0eXBlb2YgdmFsdWUgIT09IFwibnVtYmVyXCIgKVxuXHRcdFx0XHQvLyBcdGNvbnNvbGUubG9nKCBcInJldml2ZXJcIiwga2V5LCB2YWx1ZSApO1xuXG5cdFx0XHRcdC8vIFByaW1pdGl2ZVxuXHRcdFx0XHRpZiAoIHZhbHVlID09IG51bGwgfHwgdHlwZW9mIHZhbHVlICE9PSBcIm9iamVjdFwiICkgcmV0dXJuIHZhbHVlO1xuXG5cdFx0XHRcdGlmICggdmFsdWUuX2NvbGxlY3Rpb24gIT09IHVuZGVmaW5lZCAmJiB2YWx1ZS5fa2V5ICE9PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdFx0XHQvLyBUcnkgZmV0Y2hpbmcgZnJvbSBjb2xsZWN0aW9uXG5cdFx0XHRcdFx0bGV0IG9iaiA9IHRoaXNbIHZhbHVlLl9jb2xsZWN0aW9uIF0uZGljdFsgdmFsdWUuX2tleSBdO1xuXG5cdFx0XHRcdFx0Ly8gQ3JlYXRlIGl0IGlmIHJlY29uZ2l6ZWQgY29uc3RydWN0b3Jcblx0XHRcdFx0XHRpZiAoICEgb2JqICYmIHZhbHVlLl9jb25zdHJ1Y3RvciApXG5cdFx0XHRcdFx0XHRvYmogPSBuZXcgdGhpc1sgdmFsdWUuX2NvbnN0cnVjdG9yIF0oIHsga2V5OiB2YWx1ZS5fa2V5IH0gKTtcblxuXHRcdFx0XHRcdC8vIEV4cGFuZCBvdXQgcHJvcGVydGllc1xuXHRcdFx0XHRcdGZvciAoIGNvbnN0IHByb3AgaW4gdmFsdWUgKVxuXHRcdFx0XHRcdFx0aWYgKCBbIFwiX2tleVwiLCBcIl9jb2xsZWN0aW9uXCIsIFwiX2NvbnN0cnVjdG9yXCIsIFwiX2Z1bmN0aW9uXCIgXS5pbmRleE9mKCBwcm9wICkgPT09IC0gMSApXG5cdFx0XHRcdFx0XHRcdHZhbHVlWyBwcm9wIF0gPSBwcm9wcy5yZXZpdmVyKCBwcm9wLCB2YWx1ZVsgcHJvcCBdICk7XG5cblx0XHRcdFx0XHQvLyBBcHBseSBwcm9wZXJ0aWVzXG5cdFx0XHRcdFx0aWYgKCBvYmogKVxuXHRcdFx0XHRcdFx0Zm9yICggY29uc3QgcHJvcCBpbiB2YWx1ZSApXG5cdFx0XHRcdFx0XHRcdGlmICggWyBcIl9rZXlcIiwgXCJfY29sbGVjdGlvblwiLCBcIl9jb25zdHJ1Y3RvclwiLCBcIl9mdW5jdGlvblwiIF0uaW5kZXhPZiggXCJwcm9wXCIgKSA9PT0gLSAxIClcblx0XHRcdFx0XHRcdFx0XHRvYmpbIHByb3AgXSA9IHZhbHVlWyBwcm9wIF07XG5cblx0XHRcdFx0XHRyZXR1cm4gb2JqO1xuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBOb3QgY29sbGVjdGFibGUsIGJ1dCBzdGlsbCBhIGNvbnN0cnVjdGFibGVcblx0XHRcdFx0aWYgKCB2YWx1ZS5fY29uc3RydWN0b3IgKSB7XG5cblx0XHRcdFx0XHRjb25zdCBvYmogPSBuZXcgdGhpc1sgdmFsdWUuX2NvbnN0cnVjdG9yIF0oIHsga2V5OiB2YWx1ZS5fa2V5IH0gKTtcblxuXHRcdFx0XHRcdGZvciAoIGNvbnN0IHByb3AgaW4gdmFsdWUgKVxuXHRcdFx0XHRcdFx0aWYgKCBbIFwiX2tleVwiLCBcIl9jb2xsZWN0aW9uXCIsIFwiX2NvbnN0cnVjdG9yXCIsIFwiX2Z1bmN0aW9uXCIgXS5pbmRleE9mKCBwcm9wICkgPT09IC0gMSApXG5cdFx0XHRcdFx0XHRcdHZhbHVlWyBwcm9wIF0gPSBwcm9wcy5yZXZpdmVyKCBwcm9wLCB2YWx1ZVsgcHJvcCBdICk7XG5cblx0XHRcdFx0XHRpZiAoIG9iaiApXG5cdFx0XHRcdFx0XHRmb3IgKCBjb25zdCBwcm9wIGluIHZhbHVlIClcblx0XHRcdFx0XHRcdFx0aWYgKCBbIFwiX2tleVwiLCBcIl9jb2xsZWN0aW9uXCIsIFwiX2NvbnN0cnVjdG9yXCIsIFwiX2Z1bmN0aW9uXCIgXS5pbmRleE9mKCBcInByb3BcIiApID09PSAtIDEgKVxuXHRcdFx0XHRcdFx0XHRcdG9ialsgcHJvcCBdID0gdmFsdWVbIHByb3AgXTtcblxuXHRcdFx0XHRcdHJldHVybiBvYmo7XG5cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIEEgZnVuY3Rpb24gd2l0aG91dCBhcHBsaWVkIHByb3BlcnRpZXNcblx0XHRcdFx0aWYgKCB2YWx1ZS5fZnVuY3Rpb24gKSByZXR1cm4gdGhpc1sgdmFsdWUuX2Z1bmN0aW9uIF0oIHZhbHVlICk7XG5cblx0XHRcdFx0cmV0dXJuIHZhbHVlO1xuXG5cdFx0XHR9O1xuXG5cdFx0aWYgKCBlbnYuaXNTZXJ2ZXIgKSB0aGlzLmluaXRTZXJ2ZXJOZXR3b3JrKCBwcm9wcyApO1xuXHRcdGVsc2UgdGhpcy5pbml0Q2xpZW50TmV0d29yayggcHJvcHMgKTtcblxuXHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lciggXCJwbGF5ZXJKb2luXCIsIGUgPT4gdGhpcy5ldmVudFN5c3RlbS5wbGF5ZXJKb2luSGFuZGxlciggdGhpcywgZSApICk7XG5cdFx0dGhpcy5hZGRFdmVudExpc3RlbmVyKCBcInBsYXllckxlYXZlXCIsIGUgPT4gdGhpcy5ldmVudFN5c3RlbS5wbGF5ZXJMZWF2ZUhhbmRsZXIoIHRoaXMsIGUgKSApO1xuXHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lciggXCJzdGF0ZVwiLCBlID0+IHRoaXMuZXZlbnRTeXN0ZW0uc3RhdGUoIHRoaXMsIGUgKSApO1xuXG5cdH1cblxuXHRpbml0U2VydmVyTmV0d29yayggcHJvcHMgPSB7fSApIHtcblxuXHRcdHRoaXMubmV0d29yayA9IHByb3BzLmNvbnN0cnVjdG9yICE9PSBPYmplY3QgP1xuXHRcdFx0cHJvcHMgOlxuXHRcdFx0bmV3IHJ0cy5TZXJ2ZXJOZXR3b3JrKCBPYmplY3QuYXNzaWduKCB7IHBsYXllcnM6IHRoaXMucGxheWVycyB9LCBwcm9wcyApICk7XG5cblx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoIFwiY2xpZW50Sm9pblwiLCBlID0+IHRoaXMuZXZlbnRTeXN0ZW0uY2xpZW50Sm9pbkhhbmRsZXIoIHRoaXMsIGUgKSApO1xuXHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lciggXCJjbGllbnRMZWF2ZVwiLCBlID0+IHRoaXMuZXZlbnRTeXN0ZW0uY2xpZW50TGVhdmVIYW5kbGVyKCB0aGlzLCBlICkgKTtcblx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoIFwiY2xpZW50TWVzc2FnZVwiLCBlID0+IHRoaXMuZXZlbnRTeXN0ZW0uY2xpZW50TWVzc2FnZUhhbmRsZXIoIHRoaXMsIGUgKSApO1xuXG5cdFx0dGhpcy5uZXR3b3JrLmFwcCA9IHRoaXM7XG5cblx0fVxuXG5cdGluaXRDbGllbnROZXR3b3JrKCBwcm9wcyA9IHt9ICkge1xuXG5cdFx0dGhpcy5uZXR3b3JrID0gcHJvcHMgJiYgcHJvcHMuY29uc3RydWN0b3IgIT09IE9iamVjdCA/XG5cdFx0XHRwcm9wcyA6XG5cdFx0XHRuZXcgcnRzLkNsaWVudE5ldHdvcmsoIHByb3BzICk7XG5cblx0XHR0aGlzLm5ldHdvcmsuYXBwID0gdGhpcztcblxuXHR9XG5cblx0aW5pdEZhY3RvcmllcyggdHlwZXMgKSB7XG5cblx0XHRjb25zdCBhcHAgPSB0aGlzO1xuXG5cdFx0dGhpcy5QbGF5ZXIgPSBjbGFzcyBleHRlbmRzIFBsYXllciB7XG5cblx0XHRcdGNvbnN0cnVjdG9yKCBwcm9wcyApIHtcblxuXHRcdFx0XHRzdXBlciggT2JqZWN0LmFzc2lnbiggeyBhcHAgfSwgcHJvcHMgKSApO1xuXG5cdFx0XHRcdGFwcC5wbGF5ZXJzLmFkZCggdGhpcyApO1xuXHRcdFx0XHRhcHAucGxheWVycy5zb3J0KCAoIGEsIGIgKSA9PiBhLmlkID4gYi5pZCA/IDEgOiAtIDEgKTtcblxuXHRcdFx0fVxuXG5cdFx0fTtcblxuXHRcdGZvciAoIGNvbnN0IHR3ZWVuIGluIHR3ZWVucyApXG5cdFx0XHR0aGlzWyB0d2VlbiBdID0gb2JqID0+IHR3ZWVuc1sgdHdlZW4gXSggT2JqZWN0LmFzc2lnbiggeyBzdGFydFRpbWU6IHRoaXMudGltZSB9LCBvYmogKSApO1xuXG5cdFx0dGhpcy5SZWN0ID0gY2xhc3MgZXh0ZW5kcyBSZWN0IHtcblxuXHRcdFx0Y29uc3RydWN0b3IoIC4uLmFyZ3MgKSB7XG5cblx0XHRcdFx0c3VwZXIoIC4uLmFyZ3MgKTtcblxuXHRcdFx0XHRpZiAoIHRoaXMuYXBwID09PSB1bmRlZmluZWQgKSB0aGlzLmFwcCA9IGFwcDtcblxuXHRcdFx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoIFwiZGlydHlcIiwgKCkgPT4gYXBwLnVwZGF0ZXMuYWRkKCB0aGlzICkgKTtcblx0XHRcdFx0dGhpcy5hZGRFdmVudExpc3RlbmVyKCBcImNsZWFuXCIsICgpID0+IGFwcC51cGRhdGVzLnJlbW92ZSggdGhpcyApICk7XG5cblx0XHRcdH1cblxuXHRcdH07XG5cblx0XHRpZiAoIHR5cGVzICkgdGhpcy5sb2FkVHlwZXMoIHR5cGVzICk7XG5cblx0fVxuXG5cdGxvYWRUeXBlcyggdHlwZXMgKSB7XG5cblx0XHRpZiAoIHR5cGVzLnVuaXRzICkgdGhpcy5sb2FkVW5pdFR5cGVzKCB0eXBlcy51bml0cyApO1xuXHRcdGlmICggdHlwZXMuZG9vZGFkcyApIHRoaXMubG9hZERvb2RhZFR5cGVzKCB0eXBlcy5kb29kYWRzICk7XG5cblx0fVxuXG5cdGxvYWRVbml0VHlwZXMoIHR5cGVzICkge1xuXG5cdFx0Zm9yICggbGV0IGkgPSAwOyBpIDwgdHlwZXMubGVuZ3RoOyBpICsrIClcblx0XHRcdHRoaXMubG9hZFVuaXRUeXBlKCB0eXBlc1sgaSBdICk7XG5cblx0fVxuXG5cdGxvYWREb29kYWRUeXBlcyggdHlwZXMgKSB7XG5cblx0XHRmb3IgKCBsZXQgaSA9IDA7IGkgPCB0eXBlcy5sZW5ndGg7IGkgKysgKVxuXHRcdFx0dGhpcy5sb2FkRG9vZGFkVHlwZSggdHlwZXNbIGkgXSApO1xuXG5cdH1cblxuXHRsb2FkVW5pdFR5cGUoIHR5cGUgKSB7XG5cblx0XHRjb25zdCBhcHAgPSB0aGlzO1xuXG5cdFx0aWYgKCBtb2RlbHNbIHR5cGUubW9kZWwgXSA9PT0gdW5kZWZpbmVkICkge1xuXG5cdFx0XHRtb2RlbHNbIHR5cGUubW9kZWwgXSA9IG5ldyBFdmVudERpc3BhdGNoZXIoKTtcblx0XHRcdGZldGNoRmlsZSggdHlwZS5tb2RlbCApXG5cdFx0XHRcdC50aGVuKCBmaWxlID0+IHtcblxuXHRcdFx0XHRcdGNvbnN0IGV2ZW50RGlzcGF0Y2hlciA9IG1vZGVsc1sgdHlwZS5tb2RlbCBdO1xuXG5cdFx0XHRcdFx0bW9kZWxzWyB0eXBlLm1vZGVsIF0gPSBldmFsMiggZmlsZSApO1xuXG5cdFx0XHRcdFx0ZXZlbnREaXNwYXRjaGVyLmRpc3BhdGNoRXZlbnQoIHsgdHlwZTogXCJyZWFkeVwiLCBtb2RlbDogbW9kZWxzWyB0eXBlLm1vZGVsIF0gfSApO1xuXG5cdFx0XHRcdH0gKVxuXHRcdFx0XHQuY2F0Y2goIGVyciA9PiBjb25zb2xlLmVycm9yKCBlcnIgKSApO1xuXG5cdFx0fVxuXG5cdFx0dGhpc1sgdHlwZS5uYW1lIF0gPSBjbGFzcyBleHRlbmRzIFVuaXQge1xuXG5cdFx0XHRjb25zdHJ1Y3RvciggcHJvcHMgKSB7XG5cblx0XHRcdFx0c3VwZXIoIE9iamVjdC5hc3NpZ24oIHsgYXBwIH0sIHR5cGUsIHByb3BzICkgKTtcblxuXHRcdFx0XHRhcHAudW5pdHMuYWRkKCB0aGlzICk7XG5cblx0XHRcdFx0dGhpcy5hZGRFdmVudExpc3RlbmVyKCBcIm1lc2hMb2FkZWRcIiwgKCkgPT4gYXBwLnNjZW5lLmFkZCggdGhpcy5tZXNoICkgKTtcblx0XHRcdFx0dGhpcy5hZGRFdmVudExpc3RlbmVyKCBcIm1lc2hVbmxvYWRlZFwiLCAoKSA9PiBhcHAuc2NlbmUucmVtb3ZlKCB0aGlzLm1lc2ggKSApO1xuXG5cdFx0XHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lciggXCJkaXJ0eVwiLCAoKSA9PiAoIGFwcC51cGRhdGVzLmFkZCggdGhpcyApLCBhcHAucmVuZGVycy5hZGQoIHRoaXMgKSApICk7XG5cdFx0XHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lciggXCJjbGVhblwiLCAoKSA9PiAoIGFwcC51cGRhdGVzLnJlbW92ZSggdGhpcyApLCBhcHAucmVuZGVycy5yZW1vdmUoIHRoaXMgKSApICk7XG5cblx0XHRcdH1cblxuXHRcdFx0c3RhdGljIGdldCBuYW1lKCkge1xuXG5cdFx0XHRcdHJldHVybiB0eXBlLm5hbWU7XG5cblx0XHRcdH1cblxuXHRcdH07XG5cblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoIHRoaXNbIHR5cGUubmFtZSBdLmNvbnN0cnVjdG9yLCBcIm5hbWVcIiwgeyB2YWx1ZTogdHlwZS5uYW1lLCBjb25maWd1cmFibGU6IHRydWUgfSApO1xuXG5cdH1cblxuXHRsb2FkRG9vZGFkVHlwZSggdHlwZSApIHtcblxuXHRcdGNvbnN0IGFwcCA9IHRoaXM7XG5cblx0XHRpZiAoIG1vZGVsc1sgdHlwZS5tb2RlbCBdID09PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdG1vZGVsc1sgdHlwZS5tb2RlbCBdID0gbmV3IEV2ZW50RGlzcGF0Y2hlcigpO1xuXHRcdFx0ZmV0Y2hGaWxlKCB0eXBlLm1vZGVsIClcblx0XHRcdFx0LnRoZW4oIGZpbGUgPT4ge1xuXG5cdFx0XHRcdFx0Y29uc3QgZXZlbnREaXNwYXRjaGVyID0gbW9kZWxzWyB0eXBlLm1vZGVsIF07XG5cblx0XHRcdFx0XHRtb2RlbHNbIHR5cGUubW9kZWwgXSA9IGV2YWwyKCBmaWxlICk7XG5cblx0XHRcdFx0XHRldmVudERpc3BhdGNoZXIuZGlzcGF0Y2hFdmVudCggeyB0eXBlOiBcInJlYWR5XCIsIG1vZGVsOiBtb2RlbHNbIHR5cGUubW9kZWwgXSB9ICk7XG5cblx0XHRcdFx0fSApXG5cdFx0XHRcdC5jYXRjaCggZXJyID0+IGNvbnNvbGUuZXJyb3IoIGVyciApICk7XG5cblx0XHR9XG5cblx0XHR0aGlzWyB0eXBlLm5hbWUgXSA9IGNsYXNzIGV4dGVuZHMgRG9vZGFkIHtcblxuXHRcdFx0Y29uc3RydWN0b3IoIHByb3BzICkge1xuXG5cdFx0XHRcdHN1cGVyKCBPYmplY3QuYXNzaWduKCB7IGFwcCB9LCB0eXBlLCBwcm9wcyApICk7XG5cblx0XHRcdFx0YXBwLmRvb2RhZHMuYWRkKCB0aGlzICk7XG5cblx0XHRcdFx0dGhpcy5hZGRFdmVudExpc3RlbmVyKCBcIm1lc2hMb2FkZWRcIiwgKCkgPT4gYXBwLnNjZW5lLmFkZCggdGhpcy5tZXNoICkgKTtcblx0XHRcdFx0dGhpcy5hZGRFdmVudExpc3RlbmVyKCBcIm1lc2hVbmxvYWRlZFwiLCAoKSA9PiBhcHAuc2NlbmUucmVtb3ZlKCB0aGlzLm1lc2ggKSApO1xuXG5cdFx0XHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lciggXCJkaXJ0eVwiLCAoKSA9PiAoIGFwcC51cGRhdGVzLmFkZCggdGhpcyApLCBhcHAucmVuZGVycy5hZGQoIHRoaXMgKSApICk7XG5cdFx0XHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lciggXCJjbGVhblwiLCAoKSA9PiAoIGFwcC51cGRhdGVzLnJlbW92ZSggdGhpcyApLCBhcHAucmVuZGVycy5yZW1vdmUoIHRoaXMgKSApICk7XG5cblx0XHRcdH1cblxuXHRcdFx0c3RhdGljIGdldCBuYW1lKCkge1xuXG5cdFx0XHRcdHJldHVybiB0eXBlLm5hbWU7XG5cblx0XHRcdH1cblxuXHRcdH07XG5cblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoIHRoaXNbIHR5cGUubmFtZSBdLmNvbnN0cnVjdG9yLCBcIm5hbWVcIiwgeyB2YWx1ZTogdHlwZS5uYW1lLCBjb25maWd1cmFibGU6IHRydWUgfSApO1xuXG5cdH1cblxuXHRzZXRUaW1lb3V0KCBjYWxsYmFjaywgdGltZSA9IDAsIGFic29sdXRlID0gZmFsc2UgKSB7XG5cblx0XHRjb25zdCBzdWJldmVudCA9IHsgdGltZTogYWJzb2x1dGUgPyB0aW1lIDogdGhpcy50aW1lICsgdGltZSwgY2FsbGJhY2ssIGNsZWFyOiAoKSA9PiB7XG5cblx0XHRcdGNvbnN0IGluZGV4ID0gdGhpcy5zdWJldmVudHMuaW5kZXhPZiggc3ViZXZlbnQgKTtcblx0XHRcdGlmICggaW5kZXggPj0gMCApIHRoaXMuc3ViZXZlbnRzLnNwbGljZSggaW5kZXgsIDEgKTtcblxuXHRcdH0gfTtcblxuXHRcdHRoaXMuc3ViZXZlbnRzLnB1c2goIHN1YmV2ZW50ICk7XG5cblx0XHRyZXR1cm4gc3ViZXZlbnQ7XG5cblx0fVxuXG5cdHNldEludGVydmFsKCBjYWxsYmFjaywgdGltZSA9IDEgKSB7XG5cblx0XHRjb25zdCB3cmFwcGVkQ2FsbGJhY2sgPSB0aW1lID0+IHtcblxuXHRcdFx0Y2FsbGJhY2soIHRpbWUgKTtcblx0XHRcdHN1YmV2ZW50LnRpbWUgPSB0aGlzLnRpbWUgKyB0aW1lO1xuXHRcdFx0dGhpcy5zdWJldmVudHMucHVzaCggc3ViZXZlbnQgKTtcblxuXHRcdH07XG5cblx0XHRjb25zdCBzdWJldmVudCA9IHsgdGltZTogdGhpcy50aW1lICsgdGltZSwgY2FsbGJhY2s6IHdyYXBwZWRDYWxsYmFjaywgY2xlYXI6ICgpID0+IHtcblxuXHRcdFx0Y29uc3QgaW5kZXggPSB0aGlzLnN1YmV2ZW50cy5pbmRleE9mKCBzdWJldmVudCApO1xuXHRcdFx0aWYgKCBpbmRleCA+PSAwICkgdGhpcy5zdWJldmVudHMuc3BsaWNlKCBpbmRleCwgMSApO1xuXG5cdFx0fSB9O1xuXG5cdFx0dGhpcy5zdWJldmVudHMucHVzaCggc3ViZXZlbnQgKTtcblxuXHRcdHJldHVybiBzdWJldmVudDtcblxuXHR9XG5cblx0cmVuZGVyKCkge1xuXG5cdFx0d2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSggKCkgPT4gdGhpcy5yZW5kZXIoKSApO1xuXG5cdFx0Y29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcblx0XHRjb25zdCBkZWx0YSA9IG5vdyAtIHRoaXMubGFzdFJlbmRlcjtcblxuXHRcdHRoaXMubGFzdFJlbmRlciA9IG5vdztcblx0XHR0aGlzLnJlbmRlclRpbWUgKz0gZGVsdGE7XG5cblx0XHRmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLnJlbmRlcnMubGVuZ3RoOyBpICsrIClcblx0XHRcdGlmICggdHlwZW9mIHRoaXMucmVuZGVyc1sgaSBdID09PSBcImZ1bmN0aW9uXCIgKSB0aGlzLnJlbmRlcnNbIGkgXSggdGhpcy5yZW5kZXJUaW1lICk7XG5cdFx0XHRlbHNlIGlmICggdHlwZW9mIHRoaXMucmVuZGVyc1sgaSBdID09PSBcIm9iamVjdFwiICkge1xuXG5cdFx0XHRcdGlmICggdGhpcy5yZW5kZXJzWyBpIF0ucmVuZGVyICkgdGhpcy5yZW5kZXJzWyBpIF0ucmVuZGVyKCB0aGlzLnJlbmRlclRpbWUgKTtcblx0XHRcdFx0ZWxzZSBpZiAoIHRoaXMucmVuZGVyc1sgaSBdLnJlbmRlcnMgKVxuXHRcdFx0XHRcdGZvciAoIGxldCBuID0gMDsgbiA8IHRoaXMucmVuZGVyc1sgaSBdLnJlbmRlcnMubGVuZ3RoOyBuICsrIClcblx0XHRcdFx0XHRcdHRoaXMudW9kYXRlc1sgaSBdLnJlbmRlcnNbIG4gXSggdGhpcy5yZW5kZXJUaW1lICk7XG5cblx0XHRcdH1cblxuXHRcdHRoaXMucmVuZGVyZXIucmVuZGVyKCB0aGlzLnNjZW5lLCB0aGlzLmNhbWVyYSApO1xuXG5cdH1cblxuXHR1cGRhdGUoKSB7XG5cblx0XHRpZiAoIGVudi5pc1NlcnZlciApIHtcblxuXHRcdFx0Y29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcblx0XHRcdGNvbnN0IGRlbHRhID0gbm93IC0gdGhpcy5sYXN0Tm93O1xuXG5cdFx0XHR0aGlzLmxhc3ROb3cgPSBub3c7XG5cdFx0XHR0aGlzLnRpbWUgKz0gZGVsdGE7XG5cblx0XHR9IGVsc2UgaWYgKCBlbnYuaXNCcm93c2VyICkgdGhpcy5yZW5kZXJUaW1lID0gdGhpcy50aW1lO1xuXG5cdFx0Zm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy51cGRhdGVzLmxlbmd0aDsgaSArKyApXG5cdFx0XHRpZiAoIHR5cGVvZiB0aGlzLnVwZGF0ZXNbIGkgXSA9PT0gXCJmdW5jdGlvblwiICkgdGhpcy51cGRhdGVzWyBpIF0oIHRoaXMudGltZSApO1xuXHRcdFx0ZWxzZSBpZiAoIHR5cGVvZiB0aGlzLnVwZGF0ZXNbIGkgXSA9PT0gXCJvYmplY3RcIiApIHtcblxuXHRcdFx0XHRpZiAoIHRoaXMudXBkYXRlc1sgaSBdLnVwZGF0ZSApIHRoaXMudXBkYXRlc1sgaSBdLnVwZGF0ZSggdGhpcy50aW1lICk7XG5cdFx0XHRcdGVsc2UgaWYgKCB0aGlzLnVwZGF0ZXNbIGkgXS51cGRhdGVzIClcblx0XHRcdFx0XHRmb3IgKCBsZXQgbiA9IDA7IG4gPCB0aGlzLnVwZGF0ZXNbIGkgXS51cGRhdGVzLmxlbmd0aDsgbiArKyApXG5cdFx0XHRcdFx0XHR0aGlzLnVvZGF0ZXNbIGkgXS51cGRhdGVzWyBuIF0oIHRoaXMudGltZSApO1xuXG5cdFx0XHR9XG5cblx0XHRpZiAoIHRoaXMuc3ViZXZlbnRzLmxlbmd0aCApIHtcblxuXHRcdFx0Y29uc3Qgb2xkVGltZSA9IHRoaXMudGltZTtcblxuXHRcdFx0dGhpcy5zdWJldmVudHMuc29ydCggKCBhLCBiICkgPT4gYS50aW1lIC0gYi50aW1lICk7XG5cblx0XHRcdC8vIFVzZSBhIGNsb25lIHRvIHByZXZlbnQgaW5maW5pdGUgbG9vcHNcblx0XHRcdGNvbnN0IHN1YmV2ZW50cyA9IHRoaXMuc3ViZXZlbnRzLnNsaWNlKCAwICk7XG5cblx0XHRcdGxldCBpbmRleCA9IDA7XG5cdFx0XHR3aGlsZSAoIHRydWUgKSB7XG5cblx0XHRcdFx0aWYgKCBpbmRleCA9PT0gc3ViZXZlbnRzLmxlbmd0aCApIHtcblxuXHRcdFx0XHRcdGlmICggaW5kZXggPT09IHRoaXMuc3ViZXZlbnRzLmxlbmd0aCApIHRoaXMuc3ViZXZlbnRzID0gW107XG5cdFx0XHRcdFx0ZWxzZSB0aGlzLnN1YmV2ZW50cy5zcGxpY2UoIDAsIGluZGV4ICk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0fSBlbHNlIGlmICggc3ViZXZlbnRzWyBpbmRleCBdLnRpbWUgPiB0aGlzLm9mZmljaWFsVGltZSApIHtcblxuXHRcdFx0XHRcdHRoaXMuc3ViZXZlbnRzLnNwbGljZSggMCwgaW5kZXggKTtcblx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGhpcy50aW1lID0gc3ViZXZlbnRzWyBpbmRleCBdLnRpbWU7XG5cblx0XHRcdFx0aWYgKCBzdWJldmVudHNbIGluZGV4IF0uY2FsbGJhY2sgKSBzdWJldmVudHNbIGluZGV4IF0uY2FsbGJhY2soIHN1YmV2ZW50c1sgaW5kZXggXS50aW1lICk7XG5cdFx0XHRcdGVsc2UgaWYgKCBzdWJldmVudHNbIGluZGV4IF0udGFyZ2V0ICkgc3ViZXZlbnRzWyBpbmRleCBdLnRhcmdldC5kaXNwYXRjaEV2ZW50KCBzdWJldmVudHNbIGluZGV4IF0gKTtcblx0XHRcdFx0ZWxzZSB0aGlzLmRpc3BhdGNoRXZlbnQoIHN1YmV2ZW50c1sgaW5kZXggXSApO1xuXG5cdFx0XHRcdGluZGV4ICsrO1xuXG5cdFx0XHR9XG5cblx0XHRcdHRoaXMudGltZSA9IG9sZFRpbWU7XG5cblx0XHR9XG5cblx0XHRpZiAoIGVudi5pc1NlcnZlciApIHRoaXMubmV0d29yay5zZW5kKCB0aGlzLnRpbWUgKTtcblx0XHRzZXRUaW1lb3V0KCAoKSA9PiB0aGlzLnVwZGF0ZSgpLCAyNSApO1xuXG5cdH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBBcHA7XG4iXSwibmFtZXMiOlsiZW52LmlzQ2xpZW50IiwiUmFuZG9tIiwiZW52LmlzU2VydmVyIiwid3MiLCJzdHJpbmdpZnkiLCJydHMuZXZlbnRTeXN0ZW0iLCJlbnYuaXNCcm93c2VyIiwicnRzLnJlbmRlcmVyIiwicnRzLlNlcnZlck5ldHdvcmsiLCJydHMuQ2xpZW50TmV0d29yayIsImZldGNoRmlsZSJdLCJtYXBwaW5ncyI6Ijs7QUFDQSxNQUFNLFVBQVUsU0FBUyxLQUFLLENBQUM7O0NBRTlCLFdBQVcsRUFBRSxHQUFHLElBQUksR0FBRzs7RUFFdEIsS0FBSyxFQUFFLEdBQUcsSUFBSSxFQUFFLENBQUM7O0VBRWpCLElBQUksQ0FBQyxHQUFHLEdBQUcsVUFBVSxDQUFDLFVBQVUsQ0FB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Q0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsTUFBTSxHQUFHLEVBQUUsTUFBTSxDQUFDOztTQUVsQzs7O0tBR0osTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7OztLQUd4RixLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxHQUFHLE9BQU8sS0FBSyxDQUFDOzs7VUFHeEMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLEdBQUcsRUFBRSxNQUFNLENBQUM7O0tBRWxEOztRQUVHLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHOztJQUV6QixNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQzs7SUFFeEYsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksR0FBRyxPQUFPLEtBQUssQ0FBQztTQUN4QyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sR0FBRyxFQUFFLE1BQU0sQ0FBQzs7SUFFbEQ7O0VBRUYsQ0FBQyxHQUFHLENBQUMsQ0FBQzs7RUFF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QUMsU0FBUyxZQUFZLEtBQUssQ0FBQyxJQUFJLEdBQUc7O0dBRXRELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUM7R0FDekMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQzs7R0FFN0IsTUFBTSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLE1BQU07O0dBRTlFLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxVQUFVLEVBQUUsS0FBSyxFQUFFLENBQUM7O0dBRXBDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7R0FDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztHQUMvQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0dBQy9DLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7O0dBRS9DLEtBQUssSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsR0FBRzs7SUFFMUMsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUc7S0FDdEQsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFB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LENBQUMsRUFBRSxDQUFDOztFQUVwQyxDQUFDOzs7Q0FHRixFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNULEVBQUUsQ0FBQyxFQUFFLEdBQUcsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDO0NBQ3BCLEVBQUUsQ0FBQyxFQUFFLEdBQUcsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDO0NBQ3BCLEVBQUUsQ0FBQyxFQUFFLEdBQUcsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDOztDQUVwQixFQUFFLENBQUMsRUFBRSxJQUFJLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQztDQUN0QixLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDOztDQUU1QixFQUFFLENBQUMsRUFBRSxJQUFJLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQztDQUN0QixLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDOztDQUU1QixFQUFFLENBQUMsRUFBRSxJQUFJLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQztDQUN0QixLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDOztDQUU1Qjs7QUFFRCxTQUFTLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHOztDQUVyQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDVixDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7Q0FDWixDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7Q0FDWixDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7O0NBRVosT0FBTyxDQUFDLENBQUM7O0NBRVQ7O0FBRUQsU0FBUyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRzs7Q0FFM0IsTUFBTSxFQUFF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QVEsRUFBRSxHQUFHLE1BQU0sRUFBRSxDQUFDO0NBQzdHLEtBQUssT0FBTyxLQUFLLEtBQUssU0FBUyxHQUFHLE9BQU8sUUFBUSxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztDQUNqRixLQUFLLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxPQUFPLEtBQUssS0FBSyxVQUFVLEdBQUc7O0VBRS9ELEtBQUssT0FBTyxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssVUFBVSxHQUFHLE9BQU8sU0FBUyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUM7RUFDNUgsS0FBSyxPQUFPLEtBQUssQ0FBQyxNQUFNLEtBQUssVUFBVSxHQUFHLE9BQU8sU0FBUyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDOztFQUV0SCxLQUFLLE9BQU8sS0FBSyxLQUFLLFVBQVUsR0FBRyxPQUFPLElBQUksR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUM7O0VBRW5HLEtBQUssT0FBTyxFQUFFLEtBQUssRUFBRSxHQUFHOztHQUV2QixJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUM7O0dBRWQsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHO0lBQ3RDLEdBQUcsSUFBSSxFQUFFLENBQUMsR0FBRyxJQUFJLEdBQUcsRUFBRSxLQUFLLFNBQVMsRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDOztHQUVqRyxPQUFPLEdB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UyxNQUFNLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEtBQUssVUFBVSxJQUFJLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEtBQUssVUFBVSxFQUFFO0dBQzNILE9BQU8sR0FBRyxDQUFDOztFQUVaLEtBQUssR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEtBQUssVUFBVSxHQUFHOztHQUV2QyxLQUFLLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLEdBQUcsT0FBTyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0dBQzdFLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQzs7R0FFM0MsTUFBTSxLQUFLLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxLQUFLLFVBQVUsR0FBRzs7R0FFOUMsS0FBSyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztHQUM3RSxPQUFPLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7O0dBRTNDOztFQUVELE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRTtHQUN4RyxNQUFNLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7O0VBRXJHLE9BQU8sTUFBTSxHQUFHLE1BQU07R0FDckIsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFO0dBQzVFLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDOztFQUU5RTs7Q0FFRCxjQUFjLEVBQUUsR0FBRyxHQUFHOzs7RUFHckIsS0FBSyxHQUFHLENBQUMsV0FBVyxLQUFLLFNBQVMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxLQUFLLFVBQVUsSUFBSSxPQUFPLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxLQUFLLFVBQVUsRUFBRSxHQUFHOztHQUU5SCxLQUFLLElBQUksQ0FBQyxHQUFHLEdBQUcsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztHQUNyQyxPQUFPLEdBQUcsQ0FBQzs7R0FFWDs7RUFFRCxLQUFLLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEtBQUssVUFBVSxHQUFHOztHQUU5QyxLQUFLLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLEdBQUcsT0FBTyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0dBQzdFLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQzs7R0FFM0MsTUFBTSxLQUFLLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEtBQUssVUFBVSxHQUFHOztHQUVyRCxLQUFLLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLEdBQUcsT0FBTyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0dBQzdFLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQzs7R0FFM0M7O0VBRUQsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFO0dBQ3hHLE1BQU0sR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQzs7RUFFckcsT0FBTyxNQUFNLEdBQUcsTUFBTTtHQUNyQixHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJ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
