(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('ws')) :
	typeof define === 'function' && define.amd ? define(['exports', 'ws'], factory) :
	(factory((global.WebCraft = global.WebCraft || {}),global.ws));
}(this, (function (exports,ws) { 'use strict';

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

			const ws$$1 = new ws.Server( { port: props.port || 3000 } );
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

	exports.App = App;
	exports.EventDispatcher = EventDispatcher;
	exports.Unit = Unit;
	exports.Rect = Rect;
	exports.linearTween = linearTween;
	exports.isBrowser = isBrowser;
	exports.isClient = isClient;
	exports.isServer = isServer;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViY3JhZnQuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL0NvbGxlY3Rpb24uanMiLCIuLi9zcmMvbWlzYy9lbnYuanMiLCIuLi9zcmMvY29yZS9FdmVudERpc3BhdGNoZXIuanMiLCIuLi9zcmMvY29yZS9IYW5kbGUuanMiLCIuLi9zcmMvY29yZS9QbGF5ZXIuanMiLCIuLi9zcmMvY29yZS90aW1lUHJvcGVydHkuanMiLCIuLi9zcmMvZW50aXRpZXMvbW9kZWxzLmpzIiwiLi4vc3JjL21hdGgvZ2VvbWV0cnkuanMiLCIuLi9zcmMvZW50aXRpZXMvVGVycmFpbi5qcyIsIi4uL3NyYy9lbnRpdGllcy9Eb29kYWQuanMiLCIuLi9zcmMvZW50aXRpZXMvVW5pdC5qcyIsIi4uL3NyYy9taXNjL2ZldGNoRmlsZS5qcyIsIi4uL2xpYi9zZWVkcmFuZG9tLWFsZWEuanMiLCIuLi9zcmMvcHJlc2V0cy9ldmVudHMvcnRzLmpzIiwiLi4vc3JjL3ByZXNldHMvbmV0d29ya3MvY2xpZW50cy9ydHMuanMiLCIuLi9zcmMvbWlzYy9zdHJpbmdpZnkuanMiLCIuLi9zcmMvcHJlc2V0cy9uZXR3b3Jrcy9zZXJ2ZXJzL3J0cy5qcyIsIi4uL3NyYy9wcmVzZXRzL21pc2MvcmVuZGVyZXIuanMiLCIuLi9zcmMvbWlzYy9SZWN0LmpzIiwiLi4vc3JjL3R3ZWVucy9saW5lYXJUd2Vlbi5qcyIsIi4uL3NyYy9jb3JlL0FwcC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJcbmNsYXNzIENvbGxlY3Rpb24gZXh0ZW5kcyBBcnJheSB7XG5cblx0Y29uc3RydWN0b3IoIC4uLmFyZ3MgKSB7XG5cblx0XHRzdXBlciggLi4uYXJncyApO1xuXG5cdFx0dGhpcy5rZXkgPSBDb2xsZWN0aW9uLmRlZmF1bHRLZXk7XG5cdFx0dGhpcy5kaWN0ID0ge307XG5cblx0fVxuXG5cdGFkZCggLi4uaXRlbXMgKSB7XG5cblx0XHR0aGlzLnB1c2goIC4uLml0ZW1zICk7XG5cblx0XHRmb3IgKCBsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkgKysgKVxuXHRcdFx0aWYgKCBpdGVtc1sgaSBdWyB0aGlzLmtleSBdICE9PSB1bmRlZmluZWQgKVxuXHRcdFx0XHR0aGlzLmRpY3RbIGl0ZW1zWyBpIF1bIHRoaXMua2V5IF0gXSA9IGl0ZW1zWyBpIF07XG5cblx0fVxuXG5cdHJlcGxhY2UoIGFyciApIHtcblxuXHRcdHRoaXMuc3BsaWNlKCAwICk7XG5cdFx0dGhpcy5kaWN0ID0ge307XG5cblx0XHR0aGlzLmFkZCggLi4uYXJyICk7XG5cblx0fVxuXG5cdHJlbW92ZSggaXRlbSApIHtcblxuXHRcdGNvbnN0IGluZGV4ID0gdGhpcy5pbmRleE9mKCBpdGVtICk7XG5cdFx0aWYgKCBpbmRleCA+PSAwICkgdGhpcy5zcGxpY2UoIGluZGV4LCAxICk7XG5cblx0XHQvL0lzIHRoZSBzZWNvbmQgY29uZGl0aW9uIHJlcXVpcmVkPyBIb3cgZG9lcyBpdCBlZmZlY3Qgc3BlZWQ/XG5cdFx0aWYgKCBpdGVtWyB0aGlzLmtleSBdICE9PSB1bmRlZmluZWQgJiYgdGhpcy5kaWN0WyBpdGVtWyB0aGlzLmtleSBdIF0gKVxuXHRcdFx0ZGVsZXRlIHRoaXMuZGljdFsgaXRlbVsgdGhpcy5rZXkgXSBdO1xuXG5cdH1cblxufVxuXG5Db2xsZWN0aW9uLmRlZmF1bHRLZXkgPSBcImtleVwiO1xuXG5leHBvcnQgZGVmYXVsdCBDb2xsZWN0aW9uO1xuIiwiXG5leHBvcnQgY29uc3QgaXNCcm93c2VyID0gbmV3IEZ1bmN0aW9uKCBcInRyeSB7cmV0dXJuIHRoaXM9PT13aW5kb3c7fWNhdGNoKGUpeyByZXR1cm4gZmFsc2U7fVwiICkoKTtcbmV4cG9ydCBjb25zdCBpc0NsaWVudCA9IG5ldyBGdW5jdGlvbiggXCJ0cnkge3JldHVybiB0aGlzPT09d2luZG93O31jYXRjaChlKXsgcmV0dXJuIGZhbHNlO31cIiApKCk7XG5leHBvcnQgY29uc3QgaXNTZXJ2ZXIgPSAhIG5ldyBGdW5jdGlvbiggXCJ0cnkge3JldHVybiB0aGlzPT09d2luZG93O31jYXRjaChlKXsgcmV0dXJuIGZhbHNlO31cIiApKCk7XG4iLCJcbi8vIEFkYXB0ZWQgZnJvbSBUSFJFRS5qc1xuXG5pbXBvcnQgKiBhcyBlbnYgZnJvbSBcIi4uL21pc2MvZW52LmpzXCI7XG5cbmNsYXNzIEV2ZW50RGlzcGF0Y2hlciB7XG5cblx0Z2V0IF9saXN0ZW5lckNvdW50KCkge1xuXG5cdFx0bGV0IGNvdW50ID0gMDtcblxuXHRcdGZvciAoIGNvbnN0IHByb3AgaW4gdGhpcy5fbGlzdGVuZXJzIClcblx0XHRcdGNvdW50ICs9IHRoaXMuX2xpc3RlbmVyc1sgcHJvcCBdLmxlbmd0aDtcblxuXHRcdHJldHVybiBjb3VudDtcblxuXHR9XG5cblx0YWRkRXZlbnRMaXN0ZW5lciggdHlwZXMsIGxpc3RlbmVyICkge1xuXG5cdFx0aWYgKCB0eXBlcy5pbmRleE9mKCBcIiBcIiApICE9PSAtIDEgKSB0eXBlcy5zcGxpdCggXCIgXCIgKS5tYXAoIHR5cGUgPT4gdGhpcy5hZGRFdmVudExpc3RlbmVyKCB0eXBlLCBsaXN0ZW5lciApICk7XG5cblx0XHRpZiAoIHRoaXMuX2xpc3RlbmVycyA9PT0gdW5kZWZpbmVkICkgdGhpcy5fbGlzdGVuZXJzID0ge307XG5cblx0XHRpZiAoIHRoaXMuX2xpc3RlbmVyc1sgdHlwZXMgXSA9PT0gdW5kZWZpbmVkIClcblx0XHRcdHRoaXMuX2xpc3RlbmVyc1sgdHlwZXMgXSA9IFtdO1xuXG5cdFx0aWYgKCB0aGlzLl9saXN0ZW5lcnNbIHR5cGVzIF0uaW5kZXhPZiggbGlzdGVuZXIgKSA9PT0gLSAxIClcblx0XHRcdHRoaXMuX2xpc3RlbmVyc1sgdHlwZXMgXS5wdXNoKCBsaXN0ZW5lciApO1xuXG5cdH1cblxuXHRoYXNFdmVudExpc3RlbmVyKCB0eXBlLCBsaXN0ZW5lciApIHtcblxuXHRcdGlmICggdGhpcy5fbGlzdGVuZXJzID09PSB1bmRlZmluZWQgKSByZXR1cm47XG5cblx0XHRyZXR1cm4gdGhpcy5fbGlzdGVuZXJzWyB0eXBlIF0gIT09IHVuZGVmaW5lZCAmJiB0aGlzLl9saXN0ZW5lcnNbIHR5cGUgXS5pbmRleE9mKCBsaXN0ZW5lciApICE9PSAtIDE7XG5cblx0fVxuXG5cdHJlbW92ZUV2ZW50TGlzdGVuZXIoIHR5cGUsIGxpc3RlbmVyICkge1xuXG5cdFx0aWYgKCB0aGlzLl9saXN0ZW5lcnMgPT09IHVuZGVmaW5lZCApIHJldHVybjtcblxuXHRcdGlmICggdGhpcy5fbGlzdGVuZXJzWyB0eXBlIF0gPT09IHVuZGVmaW5lZCApIHJldHVybjtcblxuXHRcdGNvbnN0IGluZGV4ID0gdGhpcy5fbGlzdGVuZXJzWyB0eXBlIF0uaW5kZXhPZiggbGlzdGVuZXIgKTtcblx0XHRpZiAoIGluZGV4ICE9PSAtIDEgKSB0aGlzLl9saXN0ZW5lcnNbIHR5cGUgXS5zcGxpY2UoIGluZGV4LCAxICk7XG5cblx0fVxuXG5cdGRpc3BhdGNoRXZlbnQoIGV2ZW50LCByZWNlaXZlZCApIHtcblxuXHRcdGlmICggdGhpcy5fbGlzdGVuZXJzID09PSB1bmRlZmluZWQgKSByZXR1cm47XG5cblx0XHRjb25zdCBhcnIgPSB0aGlzLl9saXN0ZW5lcnNbIGV2ZW50LnR5cGUgXTtcblx0XHRpZiAoIGFyciA9PT0gdW5kZWZpbmVkIHx8IGFyci5sZW5ndGggPT09IDAgKSByZXR1cm47XG5cblx0XHRpZiAoIGVudi5pc0NsaWVudCAmJiAhIHJlY2VpdmVkIClcblx0XHRcdGV2ZW50LnR5cGUgPSBldmVudC50eXBlICsgXCJQcmVkaWN0aW9uXCI7XG5cblx0XHRjb25zdCBjbG9uZSA9IGFyci5zbGljZSggMCApO1xuXG5cdFx0Zm9yICggbGV0IGkgPSAwOyBpIDwgY2xvbmUubGVuZ3RoOyBpICsrIClcblx0XHRcdHRyeSB7XG5cblx0XHRcdFx0Y2xvbmVbIGkgXS5jYWxsKCB0aGlzLCBldmVudCApO1xuXG5cdFx0XHR9IGNhdGNoICggZXJyICkge1xuXG5cdFx0XHRcdC8vIFJlcG9ydCB1c2VyIGVycm9ycyBidXQgY29udGludWUgb25cblx0XHRcdFx0Y29uc29sZS5lcnJvciggZXJyICk7XG5cblx0XHRcdH1cblxuXHR9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgRXZlbnREaXNwYXRjaGVyO1xuIiwiXG5pbXBvcnQgRXZlbnREaXNwYXRjaGVyIGZyb20gXCIuL0V2ZW50RGlzcGF0Y2hlci5qc1wiO1xuXG5jbGFzcyBIYW5kbGUgZXh0ZW5kcyBFdmVudERpc3BhdGNoZXIge1xuXG5cdGNvbnN0cnVjdG9yKCBwcm9wcyApIHtcblxuXHRcdHN1cGVyKCk7XG5cblx0XHRpZiAoIHByb3BzLmlkID09PSB1bmRlZmluZWQgKVxuXHRcdFx0dGhpcy5pZCA9ICggSGFuZGxlLmlkICkgKys7XG5cblx0fVxuXG5cdGdldCBrZXkoKSB7XG5cblx0XHRyZXR1cm4gXCJoXCIgKyB0aGlzLmlkO1xuXG5cdH1cblxuXHRzZXQga2V5KCB2YWx1ZSApIHtcblxuXHRcdHRoaXMuaWQgPSB2YWx1ZS5zbGljZSggMSApO1xuXG5cdH1cblxuXHRnZXQgZW50aXR5VHlwZSgpIHtcblxuXHRcdGxldCBwcm90byA9IHRoaXM7XG5cblx0XHR3aGlsZSAoIHByb3RvICYmIEhhbmRsZS5lbnRpdHlUeXBlcy5pbmRleE9mKCBwcm90by5jb25zdHJ1Y3Rvci5uYW1lICkgPT09IC0gMSApXG5cdFx0XHRwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiggcHJvdG8gKTtcblxuXHRcdGlmICggISBwcm90byApIHJldHVybjtcblxuXHRcdHJldHVybiBwcm90by5jb25zdHJ1Y3RvcjtcblxuXHR9XG5cblx0dG9TdGF0ZSgpIHtcblxuXHRcdHJldHVybiBPYmplY3QuYXNzaWduKCB7XG5cdFx0XHRfa2V5OiB0aGlzLmtleSxcblx0XHRcdF9jb2xsZWN0aW9uOiB0aGlzLmVudGl0eVR5cGUubmFtZS50b0xvd2VyQ2FzZSgpICsgXCJzXCIsXG5cdFx0XHRfY29uc3RydWN0b3I6IHRoaXMuY29uc3RydWN0b3IubmFtZVxuXHRcdH0gKTtcblxuXHR9XG5cblx0dG9KU09OKCkge1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdF9rZXk6IHRoaXMua2V5LFxuXHRcdFx0X2NvbGxlY3Rpb246IHRoaXMuZW50aXR5VHlwZS5uYW1lLnRvTG93ZXJDYXNlKCkgKyBcInNcIlxuXHRcdH07XG5cblx0fVxuXG59XG5cbkhhbmRsZS5lbnRpdHlUeXBlcyA9IFsgXCJEb29kYWRcIiwgXCJVbml0XCIsIFwiUGxheWVyXCIsIFwiUmVjdFwiIF07XG5IYW5kbGUuaWQgPSAwO1xuXG5leHBvcnQgZGVmYXVsdCBIYW5kbGU7XG4iLCJcbmltcG9ydCBIYW5kbGUgZnJvbSBcIi4vSGFuZGxlLmpzXCI7XG5cbmNsYXNzIFBsYXllciBleHRlbmRzIEhhbmRsZSB7XG5cblx0Y29uc3RydWN0b3IoIHByb3BzID0ge30gKSB7XG5cblx0XHRzdXBlciggcHJvcHMgKTtcblxuXHRcdHRoaXMuc2hhZG93UHJvcHMgPSB7fTtcblxuXHRcdGlmICggdGhpcy5lbnRpdHlUeXBlID09PSBQbGF5ZXIgKVxuXHRcdFx0T2JqZWN0LmFzc2lnbiggdGhpcywgeyBjb2xvcjogUGxheWVyLmdldE5leHRDb2xvcigpIH0sIHByb3BzICk7XG5cblx0fVxuXG5cdHN0YXRpYyBnZXROZXh0Q29sb3IoKSB7XG5cblx0XHRsZXQgaSA9IDA7XG5cdFx0d2hpbGUgKCBpIDwgUGxheWVyLmNvbG9ycy5sZW5ndGggJiYgUGxheWVyLmNvbG9yc1sgaSBdLnRha2VuIClcblx0XHRcdGkgKys7XG5cblx0XHRpZiAoIGkgPT09IFBsYXllci5jb2xvcnMubGVuZ3RoIClcblx0XHRcdGNvbnNvbGUuZXJyb3IoIFwiVGhpcyBpcyBhd2t3YXJkXCIgKTtcblxuXHRcdHJldHVybiBpO1xuXG5cdH1cblxuXHRnZXQga2V5KCkge1xuXG5cdFx0cmV0dXJuIFwicFwiICsgdGhpcy5pZDtcblxuXHR9XG5cblx0c2V0IGtleSgga2V5ICkge1xuXG5cdFx0dGhpcy5pZCA9IHBhcnNlSW50KCBrZXkuc2xpY2UoIDEgKSApO1xuXG5cdH1cblxuXHRnZXQgY29sb3IoKSB7XG5cblx0XHRyZXR1cm4gdGhpcy5zaGFkb3dQcm9wcy5jb2xvcjtcblxuXHR9XG5cblx0c2V0IGNvbG9yKCBjb2xvciApIHtcblxuXHRcdGlmICggdHlwZW9mIGNvbG9yID09PSBcIm51bWJlclwiICkgY29sb3IgPSBQbGF5ZXIuY29sb3JzWyBjb2xvciBdO1xuXHRcdGVsc2UgaWYgKCB0eXBlb2YgY29sb3IgPT09IFwic3RyaW5nXCIgKSBjb2xvciA9IFBsYXllci5jb2xvcnMuZmluZCggYyA9PiBjLm5hbWUgPT09IGNvbG9yIHx8IGMuaGV4ID09PSBjb2xvciApO1xuXHRcdGVsc2UgcmV0dXJuO1xuXG5cdFx0aWYgKCAhIGNvbG9yICkgcmV0dXJuO1xuXG5cdFx0aWYgKCB0aGlzLnNoYWRvd1Byb3BzLmNvbG9yICkgdGhpcy5zaGFkb3dQcm9wcy5jb2xvci50YWtlbiA9IGZhbHNlO1xuXG5cdFx0dGhpcy5zaGFkb3dQcm9wcy5jb2xvciA9IGNvbG9yO1xuXHRcdHRoaXMuc2hhZG93UHJvcHMuY29sb3IudGFrZW4gPSB0cnVlO1xuXG5cdH1cblxuXHRkZXN0cm95KCkge1xuXG5cdFx0dGhpcy5jb2xvci50YWtlbiA9IGZhbHNlO1xuXG5cdH1cblxuXHR0b1N0YXRlKCkge1xuXG5cdFx0cmV0dXJuIE9iamVjdC5hc3NpZ24oIHRoaXMudG9KU09OKCksIHtcblx0XHRcdF9jb25zdHJ1Y3RvcjogdGhpcy5jb25zdHJ1Y3Rvci5uYW1lLFxuXHRcdFx0Y29sb3I6IFBsYXllci5jb2xvcnMuaW5kZXhPZiggdGhpcy5jb2xvciApXG5cdFx0fSApO1xuXG5cdH1cblxuXHR0b0pTT04oKSB7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0X2tleTogdGhpcy5rZXksXG5cdFx0XHRfY29sbGVjdGlvbjogXCJwbGF5ZXJzXCJcblx0XHR9O1xuXG5cdH1cblxufVxuXG5QbGF5ZXIuY29sb3JzID0gW1xuICAgIHsgbmFtZTogXCJyZWRcIiwgaGV4OiBcIiNGRjAwMDBcIiB9LFxuICAgIHsgbmFtZTogXCJibHVlXCIsIGhleDogXCIjNDM4NUZGXCIgfSxcbiAgICB7IG5hbWU6IFwiY3lhblwiLCBoZXg6IFwiIzY0RkZGRlwiIH0sXG4gICAgeyBuYW1lOiBcInB1cnBsZVwiLCBoZXg6IFwiIzgyMDA5NlwiIH0sXG4gICAgeyBuYW1lOiBcInllbGxvd1wiLCBoZXg6IFwiI0ZGRUEwMFwiIH0sXG4gICAgeyBuYW1lOiBcIm9yYW5nZVwiLCBoZXg6IFwiI0ZGOTkwMFwiIH0sXG4gICAgeyBuYW1lOiBcImxpbWVcIiwgaGV4OiBcIiNCRUZGMDBcIiB9LFxuICAgIHsgbmFtZTogXCJtYWdlbnRhXCIsIGhleDogXCIjRkYwMEZGXCIgfSxcbiAgICB7IG5hbWU6IFwiZ3JleVwiLCBoZXg6IFwiIzgwODA4MFwiIH0sXG4gICAgeyBuYW1lOiBcIm1pbnRcIiwgaGV4OiBcIiNBQUZGQzNcIiB9LFxuICAgIHsgbmFtZTogXCJncmVlblwiLCBoZXg6IFwiIzAwQkUwMFwiIH0sXG4gICAgeyBuYW1lOiBcImJyb3duXCIsIGhleDogXCIjQUE2RTI4XCIgfSxcbiAgICB7IG5hbWU6IFwibWFyb29uXCIsIGhleDogXCIjODAwMDAwXCIgfSxcbiAgICB7IG5hbWU6IFwibmF2eVwiLCBoZXg6IFwiIzAwMDA4MFwiIH0sXG4gICAgeyBuYW1lOiBcIm9saXZlXCIsIGhleDogXCIjODA4MDAwXCIgfSxcbiAgICB7IG5hbWU6IFwidGVhbFwiLCBoZXg6IFwiIzAwODA4MFwiIH0sXG4gICAgeyBuYW1lOiBcImxhdmVuZGVyXCIsIGhleDogXCIjRTZCRUZGXCIgfSxcbiAgICB7IG5hbWU6IFwicGlua1wiLCBoZXg6IFwiI0ZGQzlERVwiIH0sXG4gICAgeyBuYW1lOiBcImNvcmFsXCIsIGhleDogXCIjRkZEOEIxXCIgfSxcbiAgICB7IG5hbWU6IFwiYmVpZ2VcIiwgaGV4OiBcIiNGRkZBQzhcIiB9LFxuICAgIHsgbmFtZTogXCJ3aGl0ZVwiLCBoZXg6IFwiI0ZGRkZGRlwiIH0sXG4gICAgeyBuYW1lOiBcImJsYWNrXCIsIGhleDogXCIjMDAwMDAwXCIgfVxuXTtcblxuZXhwb3J0IGRlZmF1bHQgUGxheWVyO1xuIiwiXG4vLyBVc2VkIGZvciBjbGllbnQtc2lkZSBjbGFyaXR5XG5mdW5jdGlvbiB0aW1lUHJvcGVydHkoIGFwcCwgb2JqLCBuYW1lLCBub0ludGVycG9sYXRlICkge1xuXG5cdGNvbnN0IHRpbWVzID0gW107XG5cdGNvbnN0IHZhbHVlcyA9IFtdO1xuXG5cdGxldCBsYXN0VGltZTtcblx0bGV0IGxhc3RWYWx1ZTtcblxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoIG9iaiwgbmFtZSwge1xuXHRcdGdldDogKCkgPT4ge1xuXG5cdFx0XHRpZiAoIGxhc3RUaW1lID09PSBhcHAudGltZSApIHJldHVybiBsYXN0VmFsdWU7XG5cdFx0XHRpZiAoIHRpbWVzLmxlbmd0aCA9PT0gMCApIHJldHVybiB1bmRlZmluZWQ7XG5cblx0XHRcdGxldCBpbmRleCA9IHRpbWVzLmxlbmd0aCAtIDE7XG5cblx0XHRcdHdoaWxlICggaW5kZXggPiAwICYmIHRpbWVzWyBpbmRleCBdID4gYXBwLnRpbWUgKVxuXHRcdFx0XHRpbmRleCAtLTtcblxuXHRcdFx0aWYgKCAhIG5vSW50ZXJwb2xhdGUgJiYgdHlwZW9mIHZhbHVlc1sgaW5kZXggXSA9PT0gXCJmdW5jdGlvblwiIClcblx0XHRcdFx0bGFzdFZhbHVlID0gdmFsdWVzWyBpbmRleCBdKCBhcHAudGltZSApO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRsYXN0VmFsdWUgPSB2YWx1ZXNbIGluZGV4IF07XG5cblx0XHRcdHJldHVybiBsYXN0VmFsdWU7XG5cblx0XHR9LFxuXHRcdHNldDogdmFsdWUgPT4ge1xuXG5cdFx0XHRsZXQgaW5kZXggPSB0aW1lcy5sZW5ndGg7XG5cblx0XHRcdHdoaWxlICggaW5kZXggPiAwICYmIHRpbWVzWyBpbmRleCAtIDEgXSA+IGFwcC50aW1lIClcblx0XHRcdFx0aW5kZXggLS07XG5cblx0XHRcdGlmICggaW5kZXggIT09IHRpbWVzLmxlbmd0aCAmJiB0aW1lc1sgaW5kZXggXSA9PT0gYXBwLnRpbWUgKSB7XG5cblx0XHRcdFx0aWYgKCB2YWx1ZXNbIGluZGV4IF0gPT09IHZhbHVlICkgcmV0dXJuO1xuXG5cdFx0XHRcdHZhbHVlc1sgaW5kZXggXSA9IHZhbHVlO1xuXHRcdFx0XHRsYXN0VGltZSA9IHVuZGVmaW5lZDtcblxuXHRcdFx0fVxuXG5cdFx0XHR0aW1lcy5zcGxpY2UoIGluZGV4LCAwLCBhcHAudGltZSApO1xuXHRcdFx0dmFsdWVzLnNwbGljZSggaW5kZXgsIDAsIHZhbHVlICk7XG5cblx0XHR9XG5cdH0gKTtcblxufVxuXG5jbGFzcyBUaW1lUHJvcGVydHkge1xuXG5cdGNvbnN0cnVjdG9yKCkge1xuXG5cdFx0dGhpcy50aW1lcyA9IFtdO1xuXHRcdHRoaXMudmFsdWVzID0gW107XG5cblx0fVxuXG5cdHNldCggdGltZSwgdmFsdWUgKSB7XG5cblx0XHRsZXQgaW5kZXggPSB0aGlzLnRpbWVzLmxlbmd0aDtcblxuXHRcdHdoaWxlICggaW5kZXggPiAwICYmIHRoaXMudGltZXNbIGluZGV4IC0gMSBdID4gdGltZSApXG5cdFx0XHRpbmRleCAtLTtcblxuXHRcdGlmICggaW5kZXggIT09IHRoaXMudGltZXMubGVuZ3RoICYmIHRoaXMudGltZXNbIGluZGV4IF0gPT09IHRpbWUgKSB7XG5cblx0XHRcdGlmICggdGhpcy52YWx1ZXNbIGluZGV4IF0gPT09IHZhbHVlICkgcmV0dXJuO1xuXG5cdFx0XHR0aGlzLnZhbHVlc1sgaW5kZXggXSA9IHZhbHVlO1xuXHRcdFx0dGhpcy5sYXN0VGltZSA9IHVuZGVmaW5lZDtcblxuXHRcdH1cblxuXHRcdHRoaXMudGltZXMuc3BsaWNlKCBpbmRleCwgMCwgdGltZSApO1xuXHRcdHRoaXMudmFsdWVzLnNwbGljZSggaW5kZXgsIDAsIHZhbHVlICk7XG5cblx0fVxuXG5cdGdldCggdGltZSApIHtcblxuXHRcdGlmICggdGhpcy5sYXN0VGltZSA9PT0gdGltZSApIHJldHVybiB0aGlzLmxhc3RWYWx1ZTtcblx0XHRpZiAoIHRoaXMudGltZXMubGVuZ3RoID09PSAwICkgcmV0dXJuIHVuZGVmaW5lZDtcblxuXHRcdGxldCBpbmRleCA9IHRoaXMudGltZXMubGVuZ3RoIC0gMTtcblxuXHRcdHdoaWxlICggaW5kZXggPiAwICYmIHRoaXMudGltZXNbIGluZGV4IF0gPiB0aW1lIClcblx0XHRcdGluZGV4IC0tO1xuXG5cdFx0aWYgKCB0eXBlb2YgdGhpcy52YWx1ZXNbIGluZGV4IF0gPT09IFwiZnVuY3Rpb25cIiApXG5cdFx0XHR0aGlzLmxhc3RWYWx1ZSA9IHRoaXMudmFsdWVzWyBpbmRleCBdKCB0aW1lICk7XG5cdFx0ZWxzZVxuXHRcdFx0dGhpcy5sYXN0VmFsdWUgPSB0aGlzLnZhbHVlc1sgaW5kZXggXTtcblxuXHRcdHJldHVybiB0aGlzLmxhc3RWYWx1ZTtcblxuXHR9XG5cbn1cblxuZXhwb3J0IHsgVGltZVByb3BlcnR5LCB0aW1lUHJvcGVydHkgfTtcbmV4cG9ydCBkZWZhdWx0IHRpbWVQcm9wZXJ0eTtcbiIsIlxuZXhwb3J0IGRlZmF1bHQgW107XG4iLCJcbi8vIEZyb20gaHR0cDovL3d3dy5tYXRob3BlbnJlZi5jb20vY29vcmRwb2x5Z29uYXJlYTIuaHRtbFxuZnVuY3Rpb24gYXJlYU9mUG9seWdvbiggcG9seWdvbiApIHtcblxuXHRsZXQgYXJlYSA9IDA7XG5cblx0Zm9yICggbGV0IGkgPSAxOyBpIDwgcG9seWdvbi5sZW5ndGg7IGkgKysgKVxuXHRcdGFyZWEgKz0gKCBwb2x5Z29uWyBpIC0gMSBdLnggKyBwb2x5Z29uWyBpIF0ueCApICogKCBwb2x5Z29uWyBpIC0gMSBdLnkgLSBwb2x5Z29uWyBpIF0ueSApO1xuXG5cdHJldHVybiBhcmVhO1xuXG59XG5cbmZ1bmN0aW9uIGFyZWFPZlBvbHlnb25zKCBwb2x5Z29ucyApIHtcblxuXHRsZXQgYXJlYSA9IDA7XG5cblx0Zm9yICggbGV0IGkgPSAwOyBpIDwgcG9seWdvbnMubGVuZ3RoOyBpICsrIClcblx0XHRhcmVhICs9IGFyZWFPZlBvbHlnb24oIHBvbHlnb25zWyBpIF0gKTtcblxuXHRyZXR1cm4gYXJlYTtcblxufVxuXG5mdW5jdGlvbiBwb2ludEluUG9seWdvbiggcG9pbnQsIHBvbHlnb24gKSB7XG5cblx0bGV0IGluc2lkZSA9IGZhbHNlO1xuXG4gICAgLy8gR3JhYiB0aGUgZmlyc3QgdmVydGV4LCBMb29wIHRocm91Z2ggdmVydGljZXNcblx0Zm9yICggbGV0IGkgPSAxLCBwID0gcG9seWdvblsgMCBdOyBpIDw9IHBvbHlnb24ubGVuZ3RoOyBpICsrICkge1xuXG4gICAgICAgIC8vR3JhYiB0aGUgbmV4dCB2ZXJ0ZXggKHRvIGZvcm0gYSBzZWdtZW50KVxuXHRcdGNvbnN0IHEgPSBpID09PSBwb2x5Z29uLmxlbmd0aCA/IHBvbHlnb25bIDAgXSA6IHBvbHlnb25bIGkgXTtcblxuICAgICAgICAvL1Rlc3QgaWYgdGhlIHBvaW50IG1hdGNoZXMgZWl0aGVyIHZlcnRleFxuXHRcdGlmICggcS55ID09PSBwb2ludC55ICYmICggcS54ID09PSBwb2ludC54IHx8IHAueSA9PT0gcG9pbnQueSAmJiBxLnggPiBwb2ludC54ID09PSBwLnggPCBwb2ludC54ICkgKVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIC8vT25seSBjb25zaWRlciBzZWdtZW50cyB3aG9zZSAodmVydGljYWwpIGludGVydmFsIHRoZSBwb2ludCBmaXRzIGluXG5cdFx0aWYgKCBwLnkgPCBwb2ludC55ICE9PSBxLnkgPCBwb2ludC55IClcblxuICAgICAgICAgICAgLy9JZiBvbmUgZWRnZSBpcyB0byB0aGUgcmlnaHQgb2YgdXNcblx0XHRcdGlmICggcC54ID49IHBvaW50LnggKVxuXG4gICAgICAgICAgICAgICAgLy9BbmQgdGhlIG90aGVyIGlzIGFzIHdlbGwgKGEgd2FsbClcblx0XHRcdFx0aWYgKCBxLnggPiBwb2ludC54ICkgaW5zaWRlID0gISBpbnNpZGU7XG5cblx0XHRcdFx0ZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy9PdGhlcndpc2UgY2FsY3VsYXRlIGlmIHdlIGZhbGwgdG8gbGVmdCBvciByaWdodFxuXHRcdFx0XHRcdGNvbnN0IGQgPSAoIHAueCAtIHBvaW50LnggKSAqICggcS55IC0gcG9pbnQueSApIC0gKCBxLnggLSBwb2ludC54ICkgKiAoIHAueSAtIHBvaW50LnkgKTtcblxuICAgICAgICAgICAgICAgICAgICAvL1dlJ3JlIG9uIGl0IChGTE9BVCBQT0lOVClcblx0XHRcdFx0XHRpZiAoIGQgPj0gLSAxZS03ICYmIGQgPD0gMWUtNyApIHJldHVybiBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICAvL1dlIGZhbGwgdG8gdGhlIGxlZnRcblx0XHRcdFx0XHRlbHNlIGlmICggZCA+IDAgPT09IHEueSA+IHAueSApIGluc2lkZSA9ICEgaW5zaWRlO1xuXG5cdFx0XHRcdH1cblxuXHRcdFx0ZWxzZSBpZiAoIHEueCA+IHBvaW50LnggKSB7XG5cblx0XHRcdFx0Y29uc3QgZCA9ICggcC54IC0gcG9pbnQueCApICogKCBxLnkgLSBwb2ludC55ICkgLSAoIHEueCAtIHBvaW50LnggKSAqICggcC55IC0gcG9pbnQueSApO1xuXG5cdFx0XHRcdGlmICggZCA+PSAtIDFlLTcgJiYgZCA8PSAxZS03ICkgcmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRlbHNlIGlmICggZCA+IDAgPT09IHEueSA+IHAueSApIGluc2lkZSA9ICEgaW5zaWRlO1xuXG5cdFx0XHR9XG5cblx0XHRwID0gcTtcblxuXHR9XG5cblx0cmV0dXJuIGluc2lkZTtcblxufVxuXG5mdW5jdGlvbiBwb2ludEluU29tZVBvbHlnb24oIHBvaW50LCBwb2x5Z29ucyApIHtcblxuXHRmb3IgKCBsZXQgaSA9IDA7IGkgPCBwb2x5Z29ucy5sZW5ndGg7IGkgKysgKVxuXHRcdGlmICggcG9pbnRJblBvbHlnb24oIHBvaW50LCBwb2x5Z29ucyApICkgcmV0dXJuIHRydWU7XG5cblx0cmV0dXJuIGZhbHNlO1xuXG59XG5cbmV4cG9ydCB7XG4gICAgYXJlYU9mUG9seWdvbixcbiAgICBhcmVhT2ZQb2x5Z29ucyxcbiAgICBwb2ludEluUG9seWdvbixcbiAgICBwb2ludEluU29tZVBvbHlnb25cbn07XG4iLCJcbmltcG9ydCB7IHBvaW50SW5Qb2x5Z29uLCBwb2ludEluU29tZVBvbHlnb24gfSBmcm9tIFwiLi4vbWF0aC9nZW9tZXRyeS5qc1wiO1xuXG5jbGFzcyBUZXJyYWluIHtcblxuXHRjb25zdHJ1Y3RvciggcHJvcHMgKSB7XG5cblx0XHRPYmplY3QuYXNzaWduKCB0aGlzLCBwcm9wcyApO1xuXG5cdH1cblxuXHQvLyBUSGlzIGlzIG1lYW50IHRvIGJlIG9wdGltaXplZCB1c2luZyBhIHF1YWR0cmVlXG5cdHNlbGVjdFVuaXRzQm91bmRlZEJ5UmVjdGFuZ2xlKCByZWN0ICkge1xuXG5cdFx0bGV0IHVuaXRzID0gdGhpcy51bml0cyB8fCB0aGlzLmFwcCAmJiB0aGlzLmFwcC51bml0cztcblxuXHRcdGlmICggISB1bml0cyB8fCAhIHVuaXRzLmxlbmd0aCApIHJldHVybiBbXTtcblxuXHRcdHJldHVybiB1bml0cy5maWx0ZXIoIHVuaXQgPT4gcmVjdC5jb250YWlucyggdW5pdCApICk7XG5cblx0fVxuXG5cdHNlbGVjdFVuaXRzQm91bmRlZEJ5UG9seWdvbiggcG9seWdvbiApIHtcblxuXHRcdGxldCB1bml0cyA9IHRoaXMudW5pdHMgfHwgdGhpcy5hcHAgJiYgdGhpcy5hcHAudW5pdHM7XG5cblx0XHRpZiAoICEgdW5pdHMgfHwgISB1bml0cy5sZW5ndGggKSByZXR1cm4gW107XG5cblx0XHRyZXR1cm4gdW5pdHMuZmlsdGVyKCB1bml0ID0+IHBvaW50SW5Qb2x5Z29uKCB1bml0LCBwb2x5Z29uICkgKTtcblxuXHR9XG5cblx0c2VsZWN0VW5pdHNCb3VuZGVkQnlQb2x5Z29ucyggcG9seWdvbnMgKSB7XG5cblx0XHRsZXQgdW5pdHMgPSB0aGlzLnVuaXRzIHx8IHRoaXMuYXBwICYmIHRoaXMuYXBwLnVuaXRzO1xuXG5cdFx0aWYgKCAhIHVuaXRzIHx8ICEgdW5pdHMubGVuZ3RoICkgcmV0dXJuIFtdO1xuXG5cdFx0cmV0dXJuIHVuaXRzLmZpbHRlciggdW5pdCA9PiBwb2ludEluU29tZVBvbHlnb24oIHVuaXQsIHBvbHlnb25zICkgKTtcblxuXHR9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgVGVycmFpbjtcbiIsIlxuaW1wb3J0IEhhbmRsZSBmcm9tIFwiLi4vY29yZS9IYW5kbGUuanNcIjtcbmltcG9ydCB7IGlzQnJvd3NlciB9IGZyb20gXCIuLi9taXNjL2Vudi5qc1wiO1xuXG5pbXBvcnQgbW9kZWxzIGZyb20gXCIuL21vZGVscy5qc1wiO1xuXG5jbGFzcyBEb29kYWQgZXh0ZW5kcyBIYW5kbGUge1xuXG5cdGNvbnN0cnVjdG9yKCBwcm9wcyApIHtcblxuXHRcdHN1cGVyKCBwcm9wcyApO1xuXG5cdFx0dGhpcy51cGRhdGVzID0gW107XG5cblx0XHR0aGlzLnNoYWRvd1Byb3BzID0ge307XG5cblx0XHRpZiAoIHRoaXMuZW50aXR5VHlwZSA9PT0gRG9vZGFkIClcblx0XHRcdE9iamVjdC5hc3NpZ24oIHRoaXMsIHsgeDogMCwgeTogMCB9LCBwcm9wcyApO1xuXG5cdFx0dGhpcy5fZGlydHkgPSAwO1xuXG5cdH1cblxuXHRnZXQga2V5KCkge1xuXG5cdFx0cmV0dXJuIFwiZFwiICsgdGhpcy5pZDtcblxuXHR9XG5cblx0Z2V0IG1vZGVsKCkge1xuXG5cdFx0cmV0dXJuIHRoaXMuc2hhZG93UHJvcHMubW9kZWw7XG5cblx0fVxuXG5cdHNldCBtb2RlbCggbW9kZWwgKSB7XG5cblx0XHR0aGlzLnNoYWRvd1Byb3BzLm1vZGVsID0gbW9kZWw7XG5cblx0XHRpZiAoIG1vZGVsc1sgbW9kZWwgXS5wcm90b3R5cGUgaW5zdGFuY2VvZiBUSFJFRS5NZXNoICkge1xuXG5cdFx0XHR0aGlzLm1lc2ggPSBuZXcgbW9kZWxzWyBtb2RlbCBdKCBtb2RlbCApO1xuXHRcdFx0dGhpcy5tZXNoLnVzZXJEYXRhID0gdGhpcy5pZDtcblxuXHRcdH0gZWxzZSBtb2RlbHNbIG1vZGVsIF0uYWRkRXZlbnRMaXN0ZW5lciggXCJyZWFkeVwiLCAoIHsgbW9kZWw6IG1vZGVsQ2xhc3MgfSApID0+IHtcblxuXHRcdFx0dGhpcy5tZXNoID0gbmV3IG1vZGVsQ2xhc3MoIG1vZGVsICk7XG5cblx0XHRcdHRoaXMubWVzaC51c2VyRGF0YSA9IHRoaXMuaWQ7XG5cdFx0XHR0aGlzLm1lc2gucG9zaXRpb24ueCA9IHRoaXMuc2hhZG93UHJvcHMueCB8fCAwO1xuXHRcdFx0dGhpcy5tZXNoLnBvc2l0aW9uLnkgPSB0aGlzLnNoYWRvd1Byb3BzLnkgfHwgMDtcblx0XHRcdHRoaXMubWVzaC5wb3NpdGlvbi56ID0gdGhpcy5zaGFkb3dQcm9wcy56IHx8IDA7XG5cblx0XHRcdGlmICggdGhpcy5vd25lciAmJiB0aGlzLm1lc2guYWNjZW50RmFjZXMgKSB7XG5cblx0XHRcdFx0Zm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5tZXNoLmFjY2VudEZhY2VzLmxlbmd0aDsgaSArKyApXG5cdFx0XHRcdFx0dGhpcy5tZXNoLmdlb21ldHJ5LmZhY2VzWyB0aGlzLm1lc2guYWNjZW50RmFjZXNbIGkgXSBdLmNvbG9yLnNldCggdGhpcy5vd25lci5jb2xvci5oZXggKTtcblxuXHRcdFx0XHR0aGlzLm1lc2guZ2VvbWV0cnkuY29sb3JzTmVlZFVwZGF0ZSA9IHRydWU7XG5cblx0XHRcdH1cblxuXHRcdH0gKTtcblxuXHR9XG5cblx0Z2V0IG1lc2goKSB7XG5cblx0XHRyZXR1cm4gdGhpcy5zaGFkb3dQcm9wcy5tZXNoO1xuXG5cdH1cblxuXHRzZXQgbWVzaCggbWVzaCApIHtcblxuXHRcdGlmICggdGhpcy5zaGFkb3dQcm9wcy5tZXNoIGluc3RhbmNlb2YgVEhSRUUuTWVzaCApXG5cdFx0XHR0aGlzLmRpc3BhdGNoRXZlbnQoIHsgdHlwZTogXCJtZXNoVW5sb2FkZWRcIiB9ICk7XG5cblx0XHR0aGlzLnNoYWRvd1Byb3BzLm1lc2ggPSBtZXNoO1xuXG5cdFx0dGhpcy5kaXNwYXRjaEV2ZW50KCB7IHR5cGU6IFwibWVzaExvYWRlZFwiIH0gKTtcblxuXHR9XG5cblx0Z2V0IHgoKSB7XG5cblx0XHRpZiAoIHR5cGVvZiB0aGlzLnNoYWRvd1Byb3BzLnggPT09IFwiZnVuY3Rpb25cIiApXG5cdFx0XHRyZXR1cm4gdGhpcy5zaGFkb3dQcm9wcy54KCB0aGlzLmFwcCA/IHRoaXMuYXBwLnRpbWUgOiAwICk7XG5cblx0XHRyZXR1cm4gdGhpcy5zaGFkb3dQcm9wcy54O1xuXG5cdH1cblxuXHRzZXQgeCggeCApIHtcblxuXHRcdC8vIGNvbnNvbGUubG9nKCB0aGlzLmNvbnN0cnVjdG9yLm5hbWUsIHggKTtcblxuXHRcdGlmICggdHlwZW9mIHggPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgdGhpcy5zaGFkb3dQcm9wcy54ICE9PSBcImZ1bmN0aW9uXCIgKSArKyB0aGlzLmRpcnR5O1xuXHRcdGVsc2UgaWYgKCB0eXBlb2YgeCAhPT0gXCJmdW5jdGlvblwiICkge1xuXG5cdFx0XHRpZiAoIHRoaXMubWVzaCApIHRoaXMubWVzaC5wb3NpdGlvbi54ID0geDtcblx0XHRcdGlmICggdHlwZW9mIHRoaXMuc2hhZG93UHJvcHMueCA9PT0gXCJmdW5jdGlvblwiICkrKyB0aGlzLmRpcnR5O1xuXG5cdFx0fVxuXG5cdFx0dGhpcy5zaGFkb3dQcm9wcy54ID0geDtcblxuXHR9XG5cblx0Z2V0IHkoKSB7XG5cblx0XHRpZiAoIHR5cGVvZiB0aGlzLnNoYWRvd1Byb3BzLnkgPT09IFwiZnVuY3Rpb25cIiApXG5cdFx0XHRyZXR1cm4gdGhpcy5zaGFkb3dQcm9wcy55KCB0aGlzLmFwcCA/IHRoaXMuYXBwLnRpbWUgOiAwICk7XG5cblx0XHRyZXR1cm4gdGhpcy5zaGFkb3dQcm9wcy55O1xuXG5cdH1cblxuXHRzZXQgeSggeSApIHtcblxuXHRcdGlmICggdHlwZW9mIHkgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgdGhpcy5zaGFkb3dQcm9wcy55ICE9PSBcImZ1bmN0aW9uXCIgKSArKyB0aGlzLmRpcnR5O1xuXHRcdGVsc2UgaWYgKCB0eXBlb2YgeSAhPT0gXCJmdW5jdGlvblwiICkge1xuXG5cdFx0XHRpZiAoIHRoaXMubWVzaCApIHRoaXMubWVzaC5wb3NpdGlvbi55ID0geTtcblx0XHRcdGlmICggdHlwZW9mIHRoaXMuc2hhZG93UHJvcHMueSA9PT0gXCJmdW5jdGlvblwiICkrKyB0aGlzLmRpcnR5O1xuXG5cdFx0fVxuXG5cdFx0dGhpcy5zaGFkb3dQcm9wcy55ID0geTtcblxuXHR9XG5cblx0Z2V0IGRpcnR5KCkge1xuXG5cdFx0cmV0dXJuIHRoaXMuX2RpcnR5O1xuXG5cdH1cblxuXHRzZXQgZGlydHkoIGRpcnQgKSB7XG5cblx0XHRpZiAoIGlzTmFOKCBkaXJ0ICkgKSBkaXJ0ID0gMDtcblxuXHRcdGlmICggISB0aGlzLl9kaXJ0eSAmJiBkaXJ0ICkgdGhpcy5kaXNwYXRjaEV2ZW50KCB7IHR5cGU6IFwiZGlydHlcIiB9ICk7XG5cdFx0ZWxzZSBpZiAoIHRoaXMuX2RpcnR5ICYmICEgZGlydCApIHRoaXMuZGlzcGF0Y2hFdmVudCggeyB0eXBlOiBcImNsZWFuXCIgfSApO1xuXG5cdFx0dGhpcy5fZGlydHkgPSBkaXJ0O1xuXG5cdH1cblxuXHR0b1N0YXRlKCkge1xuXG5cdFx0cmV0dXJuIE9iamVjdC5hc3NpZ24oIHN1cGVyLnRvU3RhdGUoKSwge1xuXHRcdFx0eDogdGhpcy5zaGFkb3dQcm9wcy54IHx8IHRoaXMueCxcblx0XHRcdHk6IHRoaXMuc2hhZG93UHJvcHMueSB8fCB0aGlzLnksXG5cdFx0XHRmYWNpbmc6IHRoaXMuZmFjaW5nXG5cdFx0fSApO1xuXG5cdH1cblxuXHRyZW5kZXIoIHRpbWUgKSB7XG5cblx0XHRpZiAoICEgaXNCcm93c2VyIHx8ICEgdGhpcy5tZXNoICkgcmV0dXJuO1xuXG5cdFx0aWYgKCB0eXBlb2YgdGhpcy5zaGFkb3dQcm9wcy54ID09PSBcImZ1bmN0aW9uXCIgKSB0aGlzLm1lc2gucG9zaXRpb24ueCA9IHRoaXMuc2hhZG93UHJvcHMueCggdGltZSApO1xuXHRcdGlmICggdHlwZW9mIHRoaXMuc2hhZG93UHJvcHMueSA9PT0gXCJmdW5jdGlvblwiICkgdGhpcy5tZXNoLnBvc2l0aW9uLnkgPSB0aGlzLnNoYWRvd1Byb3BzLnkoIHRpbWUgKTtcblxuXHR9XG5cblx0dXBkYXRlKCB0aW1lICkge1xuXG5cdFx0Zm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy51cGRhdGVzLmxlbmd0aDsgaSArKyApXG5cdFx0XHR0aGlzLnVwZGF0ZXNbIGkgXSggdGltZSApO1xuXG5cdH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBEb29kYWQ7XG4iLCJcbmltcG9ydCBEb29kYWQgZnJvbSBcIi4vRG9vZGFkLmpzXCI7XG5cbmNsYXNzIFVuaXQgZXh0ZW5kcyBEb29kYWQge1xuXG5cdGNvbnN0cnVjdG9yKCBwcm9wcyApIHtcblxuXHRcdHN1cGVyKCBwcm9wcyApO1xuXG5cdFx0dGhpcy51cGRhdGVzID0gW107XG5cblx0XHR0aGlzLnNoYWRvd1Byb3BzID0ge307XG5cblx0XHRpZiAoIHRoaXMuZW50aXR5VHlwZSA9PT0gVW5pdCApXG5cdFx0XHRPYmplY3QuYXNzaWduKCB0aGlzLCB7IHg6IDAsIHk6IDAgfSwgcHJvcHMgKTtcblxuXHRcdHRoaXMuX2RpcnR5ID0gMDtcblxuXHR9XG5cblx0Z2V0IGtleSgpIHtcblxuXHRcdHJldHVybiBcInVcIiArIHRoaXMuaWQ7XG5cblx0fVxuXG5cdHNldCBvd25lciggb3duZXIgKSB7XG5cblx0XHRpZiAoIHRoaXMuc2hhZG93UHJvcHMub3duZXIgPT09IG93bmVyICkgcmV0dXJuO1xuXG5cdFx0dGhpcy5zaGFkb3dQcm9wcy5vd25lciA9IG93bmVyO1xuXG5cdFx0Ly8gTnVsbCBhbmQgdW5kZWZpbmVkXG5cdFx0aWYgKCBvd25lciA9PSB1bmRlZmluZWQgKSByZXR1cm47XG5cblx0XHRpZiAoIHRoaXMubWVzaCAmJiB0aGlzLm1lc2guYWNjZW50RmFjZXMgKSB7XG5cblx0XHRcdGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMubWVzaC5hY2NlbnRGYWNlcy5sZW5ndGg7IGkgKysgKVxuXHRcdFx0XHR0aGlzLm1lc2guZ2VvbWV0cnkuZmFjZXNbIHRoaXMubWVzaC5hY2NlbnRGYWNlc1sgaSBdIF0uY29sb3Iuc2V0KCBvd25lci5jb2xvci5oZXggKTtcblxuXHRcdFx0dGhpcy5tZXNoLmdlb21ldHJ5LmNvbG9yc05lZWRVcGRhdGUgPSB0cnVlO1xuXG5cdFx0fVxuXG5cdH1cblxuXHRnZXQgb3duZXIoKSB7XG5cblx0XHRyZXR1cm4gdGhpcy5zaGFkb3dQcm9wcy5vd25lcjtcblxuXHR9XG5cblx0dG9TdGF0ZSgpIHtcblxuXHRcdHJldHVybiBPYmplY3QuYXNzaWduKCBzdXBlci50b1N0YXRlKCksIHtcblx0XHRcdG93bmVyOiB0aGlzLm93bmVyXG5cdFx0fSApO1xuXG5cdH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBVbml0O1xuIiwiXG5pbXBvcnQgeyBpc0Jyb3dzZXIgfSBmcm9tIFwiLi9lbnYuanNcIjtcblxubGV0IGZldGNoRmlsZTtcblxuaWYgKCBpc0Jyb3dzZXIgKSB7XG5cblx0ZmV0Y2hGaWxlID0gcGF0aCA9PiBuZXcgUHJvbWlzZSggKCByZXNvbHZlLCByZWplY3QgKSA9PiB7XG5cblx0XHRjb25zdCByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cblx0XHRyZXF1ZXN0Lm9udGltZW91dCA9IGVyciA9PiByZWplY3QoIGVyciApO1xuXG5cdFx0cmVxdWVzdC5vbmxvYWQgPSAoKSA9PiB7XG5cblx0XHRcdGlmICggcmVxdWVzdC5yZWFkeVN0YXRlICE9PSA0ICkgcmV0dXJuO1xuXG5cdFx0XHRpZiAoIHJlcXVlc3Quc3RhdHVzID49IDQwMCApIHJldHVybiByZWplY3QoIHJlcXVlc3QgKTtcblxuXHRcdFx0cmVzb2x2ZSggcmVxdWVzdC5yZXNwb25zZVRleHQgKTtcblxuXHRcdH07XG5cblx0XHRyZXF1ZXN0Lm9wZW4oIFwiR0VUXCIsIHBhdGgsIHRydWUgKTtcblx0XHRyZXF1ZXN0LnRpbWVvdXQgPSA1MDAwO1xuXHRcdHJlcXVlc3Quc2VuZCgpO1xuXG5cdFx0cmV0dXJuIHJlcXVlc3QucmVzcG9uc2VUZXh0O1xuXG5cdH0gKTtcblxufSBlbHNlIHtcblxuXHRjb25zdCBmcyA9IHJlcXVpcmUoIFwiZnNcIiApO1xuXG5cdGZldGNoRmlsZSA9IHBhdGggPT4gbmV3IFByb21pc2UoICggcmVzb2x2ZSwgcmVqZWN0ICkgPT5cbiAgICAgICAgZnMucmVhZEZpbGUoIHBhdGgsIFwidXRmOFwiLCAoIGVyciwgcmVzICkgPT4gZXJyID8gcmVqZWN0KCBlcnIgKSA6IHJlc29sdmUoIHJlcyApICkgKTtcblxufVxuXG5leHBvcnQgZGVmYXVsdCBmZXRjaEZpbGU7XG4iLCIvLyBBIHBvcnQgb2YgYW4gYWxnb3JpdGhtIGJ5IEpvaGFubmVzIEJhYWfDuGUgPGJhYWdvZUBiYWFnb2UuY29tPiwgMjAxMFxuLy8gaHR0cDovL2JhYWdvZS5jb20vZW4vUmFuZG9tTXVzaW5ncy9qYXZhc2NyaXB0L1xuLy8gaHR0cHM6Ly9naXRodWIuY29tL25xdWlubGFuL2JldHRlci1yYW5kb20tbnVtYmVycy1mb3ItamF2YXNjcmlwdC1taXJyb3Jcbi8vIE9yaWdpbmFsIHdvcmsgaXMgdW5kZXIgTUlUIGxpY2Vuc2UgLVxuXG4vLyBDb3B5cmlnaHQgKEMpIDIwMTAgYnkgSm9oYW5uZXMgQmFhZ8O4ZSA8YmFhZ29lQGJhYWdvZS5vcmc+XG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuLy8gUmVmb3JtYXR0ZWQgYW5kIHN3YXBwZWQgZnVuY3Rpb25zIHdpdGggbGFtYmRhcywgYnV0IG90aGVyd2lzZSB0aGUgc2FtZVxuXG5mdW5jdGlvbiBBbGVhKCBzZWVkICkge1xuXG5cdGNvbnN0IG1lID0gdGhpcztcblx0Y29uc3QgbWFzaCA9IE1hc2goKTtcblxuXHRtZS5uZXh0ID0gKCkgPT4ge1xuXG5cdFx0Ly8gY29uc29sZS5sb2coIFwicmFuZG9tXCIgKTtcblxuXHRcdGNvbnN0IHQgPSAyMDkxNjM5ICogbWUuczAgKyBtZS5jICogMi4zMjgzMDY0MzY1Mzg2OTYzZS0xMDsgLy8gMl4tMzJcblx0XHRtZS5zMCA9IG1lLnMxO1xuXHRcdG1lLnMxID0gbWUuczI7XG5cblx0XHRyZXR1cm4gbWUuczIgPSB0IC0gKCBtZS5jID0gdCB8IDAgKTtcblxuXHR9O1xuXG5cdC8vIEFwcGx5IHRoZSBzZWVkaW5nIGFsZ29yaXRobSBmcm9tIEJhYWdvZS5cblx0bWUuYyA9IDE7XG5cdG1lLnMwID0gbWFzaCggXCIgXCIgKTtcblx0bWUuczEgPSBtYXNoKCBcIiBcIiApO1xuXHRtZS5zMiA9IG1hc2goIFwiIFwiICk7XG5cblx0bWUuczAgLT0gbWFzaCggc2VlZCApO1xuXHRpZiAoIG1lLnMwIDwgMCApIG1lLnMwICs9IDE7XG5cblx0bWUuczEgLT0gbWFzaCggc2VlZCApO1xuXHRpZiAoIG1lLnMxIDwgMCApIG1lLnMxICs9IDE7XG5cblx0bWUuczIgLT0gbWFzaCggc2VlZCApO1xuXHRpZiAoIG1lLnMyIDwgMCApIG1lLnMyICs9IDE7XG5cbn1cblxuZnVuY3Rpb24gY29weSggZiwgdCApIHtcblxuXHR0LmMgPSBmLmM7XG5cdHQuczAgPSBmLnMwO1xuXHR0LnMxID0gZi5zMTtcblx0dC5zMiA9IGYuczI7XG5cblx0cmV0dXJuIHQ7XG5cbn1cblxuZnVuY3Rpb24gaW1wbCggc2VlZCwgb3B0cyApIHtcblxuXHRjb25zdCB4ZyA9IG5ldyBBbGVhKCBzZWVkICksXG5cdFx0c3RhdGUgPSBvcHRzICYmIG9wdHMuc3RhdGUsXG5cdFx0cHJuZyA9IHhnLm5leHQ7XG5cblx0cHJuZy5pbnQzMiA9ICgpID0+ICggeGcubmV4dCgpICogMHgxMDAwMDAwMDAgKSB8IDA7XG5cdHBybmcuZG91YmxlID0gKCkgPT4gcHJuZygpICsgKCBwcm5nKCkgKiAweDIwMDAwMCB8IDAgKSAqIDEuMTEwMjIzMDI0NjI1MTU2NWUtMTY7IC8vIDJeLTUzO1xuXHRwcm5nLnF1aWNrID0gcHJuZztcblxuXHRpZiAoIHN0YXRlICkge1xuXG5cdFx0aWYgKCB0eXBlb2Ygc3RhdGUgPT09IFwib2JqZWN0XCIgKSBjb3B5KCBzdGF0ZSwgeGcgKTtcblxuXHRcdHBybmcuc3RhdGUgPSAoKSA9PiBjb3B5KCB4Zywge30gKTtcblxuXHR9XG5cblx0cmV0dXJuIHBybmc7XG5cbn1cblxuZnVuY3Rpb24gTWFzaCgpIHtcblxuXHRsZXQgbiA9IDB4ZWZjODI0OWQ7XG5cblx0Y29uc3QgbWFzaCA9ICggZGF0YSApID0+IHtcblxuXHRcdGRhdGEgPSBkYXRhLnRvU3RyaW5nKCk7XG5cdFx0Zm9yICggbGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkgKysgKSB7XG5cblx0XHRcdG4gKz0gZGF0YS5jaGFyQ29kZUF0KCBpICk7XG5cdFx0XHRsZXQgaCA9IDAuMDI1MTk2MDMyODI0MTY5MzggKiBuO1xuXHRcdFx0biA9IGggPj4+IDA7XG5cdFx0XHRoIC09IG47XG5cdFx0XHRoICo9IG47XG5cdFx0XHRuID0gaCA+Pj4gMDtcblx0XHRcdGggLT0gbjtcblx0XHRcdG4gKz0gaCAqIDB4MTAwMDAwMDAwOyAvLyAyXjMyXG5cblx0XHR9XG5cblx0XHRyZXR1cm4gKCBuID4+PiAwICkgKiAyLjMyODMwNjQzNjUzODY5NjNlLTEwOyAvLyAyXi0zMlxuXG5cdH07XG5cblx0cmV0dXJuIG1hc2g7XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgaW1wbDtcbiIsIlxuaW1wb3J0IFBsYXllciBmcm9tIFwiLi4vLi4vY29yZS9QbGF5ZXIuanNcIjtcbmltcG9ydCAqIGFzIGVudiBmcm9tIFwiLi4vLi4vbWlzYy9lbnYuanNcIjtcblxuaW1wb3J0IFJhbmRvbSBmcm9tIFwiLi4vLi4vLi4vbGliL3NlZWRyYW5kb20tYWxlYS5qc1wiO1xuXG5jb25zdCByZXNlcnZlZEV2ZW50VHlwZXMgPSBbIFwicGxheWVySm9pblwiLCBcInBsYXllckxlYXZlXCIsIFwic3luY1wiLCBcInN0YXRlXCIgXTtcblxuLy8gU2VydmVyXG5mdW5jdGlvbiBjbGllbnRKb2luSGFuZGxlciggYXBwLCBlICkge1xuXG5cdGNvbnN0IHBsYXllciA9IG5ldyBQbGF5ZXIoIE9iamVjdC5hc3NpZ24oIHsga2V5OiBcInBcIiArIGUuY2xpZW50LmlkIH0sIGUuY2xpZW50ICkgKTtcblx0Y29uc3QgcGxheWVyU3RhdGUgPSBwbGF5ZXIudG9TdGF0ZSgpO1xuXG5cdGNvbnN0IHNlZWQgPSBhcHAuaW5pdGlhbFNlZWQgKyBwbGF5ZXIuaWQ7XG5cdGFwcC5yYW5kb20gPSBuZXcgUmFuZG9tKCBzZWVkICk7XG5cblx0Zm9yICggbGV0IGkgPSAwOyBpIDwgYXBwLnBsYXllcnMubGVuZ3RoOyBpICsrIClcblx0XHRhcHAucGxheWVyc1sgaSBdLnNlbmQoIHtcblx0XHRcdHR5cGU6IFwicGxheWVySm9pblwiLFxuXHRcdFx0dGltZTogYXBwLnRpbWUsXG5cdFx0XHRzZWVkLFxuXHRcdFx0cGxheWVyOiBwbGF5ZXJTdGF0ZSB9ICk7XG5cblx0YXBwLnBsYXllcnMuYWRkKCBwbGF5ZXIgKTtcblx0YXBwLnBsYXllcnMuc29ydCggKCBhLCBiICkgPT4gYS5pZCA+IGIuaWQgPyAxIDogLSAxICk7XG5cblx0Ly8gY29uc29sZS5sb2coIGFwcC5zdGF0ZSApO1xuXHRwbGF5ZXIuc2VuZCgge1xuXHRcdHR5cGU6IFwic3RhdGVcIixcblx0XHR0aW1lOiBhcHAudGltZSxcblx0XHRzdGF0ZTogYXBwLnN0YXRlLFxuXHRcdHNlZWQsXG5cdFx0bG9jYWw6IHBsYXllci50b0pTT04oKVxuXHR9LCBcInRvU3RhdGVcIiApO1xuXG5cdGFwcC5kaXNwYXRjaEV2ZW50KCB7IHR5cGU6IFwicGxheWVySm9pblwiLCBwbGF5ZXIgfSApO1xuXG59XG5cbi8vIFNlcnZlclxuZnVuY3Rpb24gY2xpZW50TGVhdmVIYW5kbGVyKCBhcHAsIGUgKSB7XG5cblx0Y29uc3QgcGxheWVyID0gYXBwLnBsYXllcnMuZGljdFsgXCJwXCIgKyBlLmNsaWVudC5pZCBdO1xuXG5cdGFwcC5uZXR3b3JrLnNlbmQoIHsgdHlwZTogXCJwbGF5ZXJMZWF2ZVwiLCBwbGF5ZXIgfSApO1xuXHRhcHAuZGlzcGF0Y2hFdmVudCggeyB0eXBlOiBcInBsYXllckxlYXZlXCIsIHBsYXllciB9ICk7XG5cbn1cblxuLy8gU2VydmVyXG4vLyBUaGlzIG1vZGlmaWVzIHRoZSBhY3R1YWwgZXZlbnQsIHJlcGxhY2luZyBjbGllbnQgd2l0aCBwbGF5ZXJcbmZ1bmN0aW9uIGNsaWVudE1lc3NhZ2VIYW5kbGVyKCBhcHAsIGUgKSB7XG5cblx0aWYgKCAhIGUuY2xpZW50ICkgcmV0dXJuO1xuXG5cdC8vIElnbm9yZSB1bnNhZmUgbWVzc2FnZXNcblx0aWYgKCAhIGUubWVzc2FnZS50eXBlIHx8IHJlc2VydmVkRXZlbnRUeXBlcy5pbmRleE9mKCBlLm1lc3NhZ2UudHlwZSApICE9PSAtIDEgKSByZXR1cm47XG5cblx0Ly8gVXBkYXRlIHRoZSBnYW1lIGNsb2NrXG5cdGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG5cdGNvbnN0IGRlbHRhID0gbm93IC0gYXBwLmxhc3ROb3c7XG5cdGFwcC5sYXN0Tm93ID0gbm93O1xuXHRhcHAudGltZSArPSBkZWx0YTtcblxuXHQvLyBTZXQgcmVzZXJ2ZWQgdmFsdWVzXG5cdGUubWVzc2FnZS5wbGF5ZXIgPSBhcHAucGxheWVycy5kaWN0WyBcInBcIiArIGUuY2xpZW50LmlkIF07XG5cdGUubWVzc2FnZS50aW1lID0gYXBwLnRpbWU7XG5cblx0YXBwLm5ldHdvcmsuc2VuZCggZS5tZXNzYWdlICk7XG5cdGFwcC5kaXNwYXRjaEV2ZW50KCBlLm1lc3NhZ2UgKTtcblxufVxuXG4vLyBTZXJ2ZXIgKyBMb2NhbFxuZnVuY3Rpb24gcGxheWVySm9pbkhhbmRsZXIoIGFwcCwgZSApIHtcblxuXHQvLyBEb24ndCBkbyBhbnl0aGluZyBvbiB0aGUgc2VydmVyXG5cdGlmICggZW52LmlzU2VydmVyICkgcmV0dXJuO1xuXG5cdGlmICggZS5zZWVkICkgYXBwLnJhbmRvbSA9IG5ldyBSYW5kb20oIGUuc2VlZCApO1xuXG5cdGlmICggYXBwLnBsYXllcnMuZGljdFsgXCJwXCIgKyBlLnBsYXllci5pZCBdICkgcmV0dXJuO1xuXG5cdG5ldyBhcHAuUGxheWVyKCBPYmplY3QuYXNzaWduKCB7IGtleTogXCJwXCIgKyBlLnBsYXllci5pZCB9LCBlLnBsYXllciApICk7XG5cbn1cblxuLy8gU2VydmVyICsgTG9jYWxcbmZ1bmN0aW9uIHBsYXllckxlYXZlSGFuZGxlciggYXBwLCBlICkge1xuXG5cdGUucGxheWVyLmNvbG9yLnRha2VuID0gZmFsc2U7XG5cblx0YXBwLnBsYXllcnMucmVtb3ZlKCBlLnBsYXllciApO1xuXG59XG5cbmZ1bmN0aW9uIHN0YXRlKCBhcHAsIGUgKSB7XG5cblx0aWYgKCBlLmxvY2FsICkgYXBwLmxvY2FsUGxheWVyID0gZS5sb2NhbDtcblx0aWYgKCBlLnNlZWQgKSBhcHAucmFuZG9tID0gbmV3IFJhbmRvbSggZS5zZWVkICk7XG5cblx0Zm9yICggY29uc3QgcHJvcCBpbiBlLnN0YXRlIClcblx0XHRpZiAoIHR5cGVvZiBlLnN0YXRlWyBwcm9wIF0gIT09IFwib2JqZWN0XCIgKVxuXHRcdFx0YXBwLnN0YXRlWyBwcm9wIF0gPSBlLnN0YXRlWyBwcm9wIF07XG5cbn1cblxuZXhwb3J0IHsgY2xpZW50Sm9pbkhhbmRsZXIsIGNsaWVudExlYXZlSGFuZGxlciwgY2xpZW50TWVzc2FnZUhhbmRsZXIsIHBsYXllckpvaW5IYW5kbGVyLCByZXNlcnZlZEV2ZW50VHlwZXMsIHBsYXllckxlYXZlSGFuZGxlciwgc3RhdGUgfTtcbiIsIlxuaW1wb3J0IEV2ZW50RGlzcGF0Y2hlciBmcm9tIFwiLi4vLi4vLi4vY29yZS9FdmVudERpc3BhdGNoZXIuanNcIjtcbi8vIGltcG9ydCBFdmVudERpc3BhdGNoZXIgZnJvbSBcIi4uLy4uLy4uLy4uL2NvcmUvRXZlbnREaXNwYXRjaGVyXCI7XG5cbmNsYXNzIENsaWVudE5ldHdvcmsgZXh0ZW5kcyBFdmVudERpc3BhdGNoZXIge1xuXG5cdGNvbnN0cnVjdG9yKCBwcm9wcyA9IHt9ICkge1xuXG5cdFx0c3VwZXIoKTtcblxuXHRcdHRoaXMucHJvdG9jb2wgPSBwcm9wcy5wcm90b2NvbCB8fCBcIndzXCI7XG5cdFx0dGhpcy5ob3N0ID0gcHJvcHMuaG9zdCB8fCBcImxvY2FsaG9zdFwiO1xuXHRcdHRoaXMucG9ydCA9IHByb3BzLnBvcnQgfHwgMzAwMDtcblx0XHR0aGlzLmFwcCA9IHByb3BzLmFwcDtcblx0XHR0aGlzLnJldml2ZXIgPSBwcm9wcy5yZXZpdmVyO1xuXG5cdFx0dGhpcy5jb25uZWN0KCk7XG5cblx0fVxuXG5cdGNvbm5lY3QoKSB7XG5cblx0XHR0aGlzLnNvY2tldCA9IG5ldyBXZWJTb2NrZXQoIGAke3RoaXMucHJvdG9jb2x9Oi8vJHt0aGlzLmhvc3R9OiR7dGhpcy5wb3J0fWAgKTtcblxuXHRcdHRoaXMuc29ja2V0LmFkZEV2ZW50TGlzdGVuZXIoIFwibWVzc2FnZVwiLCBlID0+IHtcblxuXHRcdFx0Ly8gaWYgKCBpc05hTiggZS5kYXRhICkgKSBjb25zb2xlLmxvZyggSlNPTi5wYXJzZSggZS5kYXRhICkgKTtcblxuXHRcdFx0ZSA9IEpTT04ucGFyc2UoIGUuZGF0YSwgdGhpcy5yZXZpdmVyICk7XG5cblx0XHRcdGlmICggdHlwZW9mIGUgPT09IFwibnVtYmVyXCIgKSB7XG5cblx0XHRcdFx0dGhpcy5hcHAudGltZSA9IGU7XG5cdFx0XHRcdHRoaXMuYXBwLm9mZmljaWFsVGltZSA9IGU7XG5cdFx0XHRcdHRoaXMuYXBwLnVwZGF0ZSgpO1xuXHRcdFx0XHR0aGlzLmFwcC5kaXNwYXRjaEV2ZW50KCB7IHR5cGU6IFwidGltZVwiLCB0aW1lOiBlIH0sIHRydWUgKTtcblxuXHRcdFx0fSBlbHNlIGlmICggZSBpbnN0YW5jZW9mIEFycmF5ICkge1xuXG5cdFx0XHRcdGZvciAoIGxldCBpID0gMDsgaSA8IGUubGVuZ3RoOyBpICsrICkge1xuXG5cdFx0XHRcdFx0aWYgKCB0aGlzLmFwcCAmJiBlWyBpIF0udGltZSApIHtcblxuXHRcdFx0XHRcdFx0dGhpcy5hcHAudGltZSA9IGVbIGkgXS50aW1lO1xuXHRcdFx0XHRcdFx0dGhpcy5hcHAub2ZmaWNpYWxUaW1lID0gZVsgaSBdLnRpbWU7XG5cdFx0XHRcdFx0XHR0aGlzLmFwcC51cGRhdGUoKTtcblxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHRoaXMuYXBwLmRpc3BhdGNoRXZlbnQoIGVbIGkgXSwgdHJ1ZSApO1xuXG5cdFx0XHRcdH1cblxuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHRpZiAoIHRoaXMuYXBwICYmIGUudGltZSApIHtcblxuXHRcdFx0XHRcdHRoaXMuYXBwLnRpbWUgPSBlLnRpbWU7XG5cdFx0XHRcdFx0dGhpcy5hcHAub2ZmaWNpYWxUaW1lID0gZS50aW1lO1xuXHRcdFx0XHRcdHRoaXMuYXBwLnVwZGF0ZSgpO1xuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLmFwcC5kaXNwYXRjaEV2ZW50KCBlLCB0cnVlICk7XG5cblx0XHRcdH1cblxuXHRcdH0gKTtcblxuXHRcdHRoaXMuc29ja2V0LmFkZEV2ZW50TGlzdGVuZXIoIFwib3BlblwiLCAoKSA9PiB0aGlzLmRpc3BhdGNoRXZlbnQoIFwib3BlblwiICkgKTtcblx0XHR0aGlzLnNvY2tldC5hZGRFdmVudExpc3RlbmVyKCBcImNsb3NlXCIsICgpID0+IHRoaXMub25DbG9zZSgpICk7XG5cblx0fVxuXG5cdG9uQ2xvc2UoKSB7XG5cblx0XHR0aGlzLmRpc3BhdGNoRXZlbnQoIFwiY2xvc2VcIiApO1xuXG5cdFx0aWYgKCB0aGlzLmF1dG9SZWNvbm5lY3QgKSB0aGlzLmNvbm5lY3QoKTtcblxuXHR9XG5cblx0c2VuZCggZGF0YSApIHtcblxuXHRcdGRhdGEgPSBKU09OLnN0cmluZ2lmeSggZGF0YSwgdGhpcy5yZXBsYWNlciApO1xuXG5cdFx0dGhpcy5zb2NrZXQuc2VuZCggZGF0YSApO1xuXG5cdH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBDbGllbnROZXR3b3JrO1xuIiwiXG4vLyBBZGFwYXRlZCBmcm9tIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0pTT04jUG9seWZpbGxcblxuY29uc3QgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgKCBhID0+IHRvU3RyaW5nLmNhbGwoIGEgKSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiICk7XG5jb25zdCBlc2NNYXAgPSB7IFwiXFxcIlwiOiBcIlxcXFxcXFwiXCIsIFwiXFxcXFwiOiBcIlxcXFxcXFxcXCIsIFwiXFxiXCI6IFwiXFxcXGJcIiwgXCJcXGZcIjogXCJcXFxcZlwiLCBcIlxcblwiOiBcIlxcXFxuXCIsIFwiXFxyXCI6IFwiXFxcXHJcIiwgXCJcXHRcIjogXCJcXFxcdFwiIH07XG5jb25zdCBlc2NGdW5jID0gbSA9PiBlc2NNYXBbIG0gXSB8fCBcIlxcXFx1XCIgKyAoIG0uY2hhckNvZGVBdCggMCApICsgMHgxMDAwMCApLnRvU3RyaW5nKCAxNiApLnN1YnN0ciggMSApO1xuY29uc3QgZXNjUkUgPSAvW1xcXFxcIlxcdTAwMDAtXFx1MDAxRlxcdTIwMjhcXHUyMDI5XS9nO1xuY29uc3QgZGVmYXVsdFJlcGxhY2VyID0gKCBwcm9wLCB2YWx1ZSApID0+IHZhbHVlO1xuXG5mdW5jdGlvbiBzdHJpbmdpZnkoIHZhbHVlLCByZXBsYWNlciA9IGRlZmF1bHRSZXBsYWNlciwgdG9KU09OID0gXCJ0b0pTT05cIiApIHtcblxuXHRpZiAoIHZhbHVlID09IG51bGwgKSByZXR1cm4gXCJudWxsXCI7XG5cdGlmICggdHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiICkgcmV0dXJuIHJlcGxhY2VyKCB1bmRlZmluZWQsIGlzRmluaXRlKCB2YWx1ZSApID8gdmFsdWUudG9TdHJpbmcoKSA6IFwibnVsbFwiICk7XG5cdGlmICggdHlwZW9mIHZhbHVlID09PSBcImJvb2xlYW5cIiApIHJldHVybiByZXBsYWNlciggdW5kZWZpbmVkLCB2YWx1ZS50b1N0cmluZygpICk7XG5cdGlmICggdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiICkge1xuXG5cdFx0aWYgKCB0eXBlb2YgdmFsdWVbIHRvSlNPTiBdID09PSBcImZ1bmN0aW9uXCIgKSByZXR1cm4gc3RyaW5naWZ5KCByZXBsYWNlciggdW5kZWZpbmVkLCB2YWx1ZVsgdG9KU09OIF0oKSApLCByZXBsYWNlciwgdG9KU09OICk7XG5cdFx0aWYgKCB0eXBlb2YgdmFsdWUudG9KU09OID09PSBcImZ1bmN0aW9uXCIgKSByZXR1cm4gc3RyaW5naWZ5KCByZXBsYWNlciggdW5kZWZpbmVkLCB2YWx1ZS50b0pTT04oKSApLCByZXBsYWNlciwgdG9KU09OICk7XG5cblx0XHRpZiAoIHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiICkgcmV0dXJuIFwiXFxcIlwiICsgdmFsdWUudG9TdHJpbmcoKS5yZXBsYWNlKCBlc2NSRSwgZXNjRnVuYyApICsgXCJcXFwiXCI7XG5cblx0XHRpZiAoIGlzQXJyYXkoIHZhbHVlICkgKSB7XG5cblx0XHRcdGxldCByZXMgPSBcIltcIjtcblxuXHRcdFx0Zm9yICggbGV0IGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpICsrIClcblx0XHRcdFx0cmVzICs9ICggaSA/IFwiLCBcIiA6IFwiXCIgKSArIHN0cmluZ2lmeSggcmVwbGFjZXIuY2FsbCggdmFsdWUsIGksIHZhbHVlWyBpIF0gKSwgcmVwbGFjZXIsIHRvSlNPTiApO1xuXG5cdFx0XHRyZXR1cm4gcmVzICsgXCJdXCI7XG5cblx0XHR9XG5cblx0XHRjb25zdCB0bXAgPSBbXTtcblxuXHRcdGZvciAoIGNvbnN0IHByb3AgaW4gdmFsdWUgKVxuXHRcdFx0aWYgKCB2YWx1ZS5oYXNPd25Qcm9wZXJ0eSggcHJvcCApIClcblx0XHRcdFx0dG1wLnB1c2goIHN0cmluZ2lmeSggcmVwbGFjZXIuY2FsbCggdmFsdWUsIHByb3AsIHByb3AgKSwgcmVwbGFjZXIsIHRvSlNPTiApICsgXCI6IFwiICsgc3RyaW5naWZ5KCByZXBsYWNlci5jYWxsKCB2YWx1ZSwgcHJvcCwgdmFsdWVbIHByb3AgXSApLCByZXBsYWNlciwgdG9KU09OICkgKTtcblxuXHRcdHJldHVybiBcIntcIiArIHRtcC5qb2luKCBcIiwgXCIgKSArIFwifVwiO1xuXG5cdH1cblxuXHRyZXR1cm4gXCJcXFwiXCIgKyB2YWx1ZS50b1N0cmluZygpLnJlcGxhY2UoIGVzY1JFLCBlc2NGdW5jICkgKyBcIlxcXCJcIjtcblxufVxuXG5leHBvcnQgZGVmYXVsdCBzdHJpbmdpZnk7XG4iLCJcbmltcG9ydCB7IFNlcnZlciB9IGZyb20gXCJ3c1wiO1xuXG5pbXBvcnQgRXZlbnREaXNwYXRjaGVyIGZyb20gXCIuLi8uLi8uLi9jb3JlL0V2ZW50RGlzcGF0Y2hlclwiO1xuaW1wb3J0IEhhbmRsZSBmcm9tIFwiLi4vLi4vLi4vY29yZS9IYW5kbGVcIjtcbmltcG9ydCBDb2xsZWN0aW9uIGZyb20gXCIuLi8uLi8uLi9jb3JlL0NvbGxlY3Rpb24uanNcIjtcbmltcG9ydCBzdHJpbmdpZnkgZnJvbSBcIi4uLy4uLy4uL21pc2Mvc3RyaW5naWZ5LmpzXCI7XG5cbmNsYXNzIFNlcnZlck5ldHdvcmsgZXh0ZW5kcyBFdmVudERpc3BhdGNoZXIge1xuXG5cdGNvbnN0cnVjdG9yKCBwcm9wcyA9IHt9ICkge1xuXG5cdFx0c3VwZXIoKTtcblxuXHRcdHRoaXMuY2xpZW50cyA9IHByb3BzLmNsaWVudHMgfHwgbmV3IENvbGxlY3Rpb24oKTtcblx0XHR0aGlzLndzID0gcHJvcHMud3MgJiYgcHJvcHMud3MuY29uc3RydWN0b3IgIT09IE9iamVjdCAmJiBwcm9wcy53cyB8fCB0aGlzLmNyZWF0ZVdTKCBwcm9wcyApO1xuXG5cdFx0dGhpcy5jaGFyc1NlbnQgPSAwO1xuXG5cdFx0c2V0SW50ZXJ2YWwoICgpID0+IHtcblxuXHRcdFx0aWYgKCAhIHRoaXMuY2hhcnNTZW50ICkgcmV0dXJuO1xuXHRcdFx0Ly8gY29uc29sZS5sb2coIHRoaXMuY2hhcnNTZW50ICk7XG5cdFx0XHR0aGlzLmNoYXJzU2VudCA9IDA7XG5cblx0XHR9LCAxMDAwICk7XG5cblx0fVxuXG5cdHNlbmQoIGRhdGEsIHRvSlNPTiApIHtcblxuXHRcdGlmICggdHlwZW9mIGRhdGEgPT09IFwib2JqZWN0XCIgKSB7XG5cblx0XHRcdGlmICggdGhpcy5hcHAgKSB7XG5cblx0XHRcdFx0aWYgKCBkYXRhIGluc3RhbmNlb2YgQXJyYXkgKSB7XG5cblx0XHRcdFx0XHRmb3IgKCBsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSArKyApXG5cdFx0XHRcdFx0XHRpZiAoIGRhdGFbIGkgXS50aW1lID09PSB1bmRlZmluZWQgKSBkYXRhWyBpIF0udGltZSA9IHRoaXMuYXBwLnRpbWU7XG5cblx0XHRcdFx0fSBlbHNlIGlmICggZGF0YS50aW1lID09PSB1bmRlZmluZWQgKSBkYXRhLnRpbWUgPSB0aGlzLmFwcC50aW1lO1xuXG5cdFx0XHR9XG5cblx0XHRcdGlmICggdG9KU09OICkgZGF0YSA9IHN0cmluZ2lmeSggZGF0YSwgdGhpcy5yZXBsYWNlciwgdG9KU09OICk7XG5cdFx0XHRlbHNlIGRhdGEgPSBKU09OLnN0cmluZ2lmeSggZGF0YSwgdGhpcy5yZXBsYWNlciApO1xuXG5cdFx0fSBlbHNlIGlmICggdHlwZW9mIGRhdGEgIT09IFwic3RyaW5nXCIgKSBkYXRhID0gZGF0YS50b1N0cmluZygpO1xuXG5cdFx0Ly8gaWYgKCB0aGlzLmNsaWVudHMubGVuZ3RoIClcblx0XHQvLyBcdGNvbnNvbGUubG9nKCBcIlNFTkRcIiwgZGF0YSApO1xuXG5cdFx0Zm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5jbGllbnRzLmxlbmd0aDsgaSArKyApIHtcblxuXHRcdFx0dHJ5IHtcblxuXHRcdFx0XHR0aGlzLmNsaWVudHNbIGkgXS5zZW5kKCBkYXRhICk7XG5cblx0XHRcdH0gY2F0Y2ggKCBlcnIgKSB7fVxuXG5cdFx0XHR0aGlzLmNoYXJzU2VudCArPSBkYXRhLmxlbmd0aDtcblxuXHRcdH1cblxuXHR9XG5cblx0Y3JlYXRlV1MoIHByb3BzID0ge30gKSB7XG5cblx0XHRjb25zdCB3cyA9IG5ldyBTZXJ2ZXIoIHsgcG9ydDogcHJvcHMucG9ydCB8fCAzMDAwIH0gKTtcblx0XHRjb25zb2xlLmxvZyggXCJMaXN0ZW5pbmcgb25cIiwgcHJvcHMucG9ydCB8fCAzMDAwICk7XG5cblx0XHR3cy5vbiggXCJjb25uZWN0aW9uXCIsIHNvY2tldCA9PiB7XG5cblx0XHRcdHNvY2tldC5pZCA9ICggSGFuZGxlLmlkICkrKztcblx0XHRcdHNvY2tldC5rZXkgPSBcImNcIiArIHNvY2tldC5pZDtcblx0XHRcdHRoaXMuY2xpZW50cy5hZGQoIHNvY2tldCApO1xuXHRcdFx0Y29uc29sZS5sb2coIFwiQ29ubmVjdGlvbiBmcm9tXCIsIHNvY2tldC5fc29ja2V0LnJlbW90ZUFkZHJlc3MsIFwib25cIiwgc29ja2V0Ll9zb2NrZXQucmVtb3RlUG9ydCwgXCJhc1wiLCBzb2NrZXQuaWQgKTtcblxuXHRcdFx0c29ja2V0Lm9uY2xvc2UgPSAoKSA9PiB7XG5cblx0XHRcdFx0dGhpcy5jbGllbnRzLnJlbW92ZSggc29ja2V0ICk7XG5cblx0XHRcdFx0dGhpcy5hcHAuZGlzcGF0Y2hFdmVudCggeyB0eXBlOiBcImNsaWVudExlYXZlXCIsIGNsaWVudDogeyBpZDogc29ja2V0LmlkIH0gfSApO1xuXG5cdFx0XHR9O1xuXG5cdFx0XHRzb2NrZXQub25tZXNzYWdlID0gZGF0YSA9PiB7XG5cblx0XHRcdFx0Ly8gSWdub3JlIGxhcmdlIG1lc3NhZ2VzXG5cdFx0XHRcdGlmICggZGF0YS5sZW5ndGggPiAxMDAwICkgcmV0dXJuO1xuXG5cdFx0XHRcdHRyeSB7XG5cblx0XHRcdFx0XHRkYXRhID0gSlNPTi5wYXJzZSggZGF0YS5kYXRhLCB0aGlzLnJldml2ZXIgKTtcblxuXHRcdFx0XHR9IGNhdGNoICggZXJyICkge1xuXG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvciggXCJJbnZhbGlkIG1lc3NhZ2UgZnJvbSBjbGllbnRcIiwgc29ja2V0LmtleSApO1xuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoIFwiTWF5IGJlIGEgYnVnIGluIHRoZSBjb2RlIG9yIG5lZmFyaW91cyBhY3Rpb25cIiApO1xuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLmFwcC5kaXNwYXRjaEV2ZW50KCB7IHR5cGU6IFwiY2xpZW50TWVzc2FnZVwiLCBjbGllbnQ6IHsgaWQ6IHNvY2tldC5pZCB9LCBtZXNzYWdlOiBkYXRhIH0gKTtcblxuXHRcdFx0fTtcblxuXHRcdFx0dGhpcy5hcHAuZGlzcGF0Y2hFdmVudCggeyB0eXBlOiBcImNsaWVudEpvaW5cIiwgY2xpZW50OiB7IGlkOiBzb2NrZXQuaWQsIHNlbmQ6ICggZGF0YSwgdG9KU09OICkgPT4ge1xuXG5cdFx0XHRcdGlmICggdHlwZW9mIGRhdGEgPT09IFwib2JqZWN0XCIgKSB7XG5cblx0XHRcdFx0XHRpZiAoIHRoaXMuYXBwICkge1xuXG5cdFx0XHRcdFx0XHRpZiAoIGRhdGEgaW5zdGFuY2VvZiBBcnJheSApIHtcblxuXHRcdFx0XHRcdFx0XHRmb3IgKCBsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSArKyApXG5cdFx0XHRcdFx0XHRcdFx0aWYgKCBkYXRhWyBpIF0udGltZSA9PT0gdW5kZWZpbmVkICkgZGF0YVsgaSBdLnRpbWUgPSB0aGlzLmFwcC50aW1lO1xuXG5cdFx0XHRcdFx0XHR9IGVsc2UgaWYgKCBkYXRhLnRpbWUgPT09IHVuZGVmaW5lZCApIGRhdGEudGltZSA9IHRoaXMuYXBwLnRpbWU7XG5cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoIHRvSlNPTiApIGRhdGEgPSBzdHJpbmdpZnkoIGRhdGEsIHRoaXMucmVwbGFjZXIsIHRvSlNPTiApO1xuXHRcdFx0XHRcdGVsc2UgZGF0YSA9IEpTT04uc3RyaW5naWZ5KCBkYXRhLCB0aGlzLnJlcGxhY2VyICk7XG5cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRyeSB7XG5cblx0XHRcdFx0XHRzb2NrZXQuc2VuZCggZGF0YSApO1xuXG5cdFx0XHRcdH0gY2F0Y2ggKCBlcnIgKSB7fVxuXG5cdFx0XHR9IH0gfSApO1xuXG5cdFx0fSApO1xuXG5cdFx0cmV0dXJuIHdzO1xuXG5cdH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBTZXJ2ZXJOZXR3b3JrO1xuIiwiXG5mdW5jdGlvbiByZW5kZXJlcigpIHtcblxuXHRjb25zdCByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKCB7IGFudGlhbGlhczogdHJ1ZSB9ICk7XG5cdHJlbmRlcmVyLnNoYWRvd01hcC5lbmFibGVkID0gdHJ1ZTtcblx0cmVuZGVyZXIuc2hhZG93TWFwLnR5cGUgPSBUSFJFRS5QQ0ZTb2Z0U2hhZG93TWFwO1xuXG5cdHJlbmRlcmVyLnNldFNpemUoIHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQgKTtcblxuXHRpZiAoIGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwiY29tcGxldGVcIiB8fCBkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImxvYWRlZFwiIHx8IGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwiaW50ZXJhY3RpdmVcIiApXG5cdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggcmVuZGVyZXIgKTtcblxuXHRlbHNlIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoIFwiRE9NQ29udGVudExvYWRlZFwiLCAoKSA9PiBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKCByZW5kZXJlci5kb21FbGVtZW50ICkgKTtcblxuXHRyZXR1cm4gcmVuZGVyZXI7XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgcmVuZGVyZXI7XG4iLCJcbmltcG9ydCBFdmVudERpc3BhdGNoZXIgZnJvbSBcIi4uL2NvcmUvRXZlbnREaXNwYXRjaGVyLmpzXCI7XG5cbmxldCByZWN0SWQgPSAwO1xuXG5jbGFzcyBSZWN0IGV4dGVuZHMgRXZlbnREaXNwYXRjaGVyIHtcblxuXHRjb25zdHJ1Y3RvciggcDEsIHAyLCB4MiwgeTIsIHByb3BzID0ge30gKSB7XG5cblx0XHRzdXBlcigpO1xuXG5cdFx0dGhpcy5pZCA9IHJlY3RJZCArKztcblxuXHRcdC8vIFBhc3NlZCBhcyB4MSwgeTEsIHgyLCB5MlxuXHRcdGlmICggdHlwZW9mIHAxID09PSBcIm51bmJlclwiICkge1xuXG5cdFx0XHR0aGlzLm1pblggPSBNYXRoLm1pbiggcDEsIHgyICk7XG5cdFx0XHR0aGlzLm1heFggPSBNYXRoLm1heCggcDEsIHgyICk7XG5cdFx0XHR0aGlzLm1pblkgPSBNYXRoLm1pbiggcDIsIHkyICk7XG5cdFx0XHR0aGlzLm1heFkgPSBNYXRoLm1heCggcDIsIHkyICk7XG5cblx0XHQvLyBQYXNzZWQgYXMge3gxLCB5MX0sIHt4MiwgeTJ9XG5cblx0XHR9IGVsc2UgaWYgKCBwMS54ICE9PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdHRoaXMubWluWCA9IE1hdGgubWluKCBwMS54LCBwMi54ICk7XG5cdFx0XHR0aGlzLm1heFggPSBNYXRoLm1heCggcDEueCwgcDIueCApO1xuXHRcdFx0dGhpcy5taW5ZID0gTWF0aC5taW4oIHAxLnksIHAyLnkgKTtcblx0XHRcdHRoaXMubWF4WSA9IE1hdGgubWF4KCBwMS55LCBwMi55ICk7XG5cblx0XHRcdGlmICggeDIgIT09IHVuZGVmaW5lZCApIHByb3BzID0geDI7XG5cblx0XHQvLyBOb3QgcGFzc2VkP1xuXG5cdFx0fSBlbHNlIHtcblxuXHRcdFx0aWYgKCBwMSAhPT0gdW5kZWZpbmVkICkgcHJvcHMgPSBwMTtcblxuXHRcdH1cblxuXHRcdGlmICggcHJvcHMudW5pdEVudGVyICkgdGhpcy5hZGRFdmVudExpc3RlbmVyKCBcInVuaXRFbnRlclwiLCBwcm9wcy51bml0RW50ZXIgKTtcblx0XHRpZiAoIHByb3BzLnVuaXRMZWF2ZSApIHRoaXMuYWRkRXZlbnRMaXN0ZW5lciggXCJ1bml0TGVhdmVcIiwgcHJvcHMudW5pdExlYXZlICk7XG5cblx0XHRPYmplY3QuYXNzaWduKCB0aGlzLCB7IHVuaXRzOiBbXSB9LCBwcm9wcyApO1xuXG5cdH1cblxuXHRnZXQga2V5KCkge1xuXG5cdFx0cmV0dXJuIFwiclwiICsgdGhpcy5pZDtcblxuXHR9XG5cblx0YWRkRXZlbnRMaXN0ZW5lciggdHlwZSwgLi4uYXJncyApIHtcblxuXHRcdGlmICggKCB0eXBlID09PSBcInVuaXRFbnRlclwiIHx8IHR5cGUgPT09IFwidW5pdExlYXZlXCIgKSAmJiAoICEgdGhpcy5fbGlzdGVuZXJzLnVuaXRFbnRlciB8fCAhIHRoaXMuX2xpc3RlbmVycy51bml0RW50ZXIubGVuZ3RoICkgJiYgKCAhIHRoaXMuX2xpc3RlbmVycy51bml0TGVhdmUgfHwgISB0aGlzLl9saXN0ZW5lcnMudW5pdExlYXZlLmxlbmd0aCApIClcblx0XHRcdHRoaXMuZGlzcGF0Y2hFdmVudCggeyB0eXBlOiBcImRpcnR5XCIgfSApO1xuXG5cdFx0c3VwZXIuYWRkRXZlbnRMaXN0ZW5lciggdHlwZSwgLi4uYXJncyApO1xuXG5cdH1cblxuXHQvLyBSZXR1cm5zIHRydWUgaWYgYSBwb2ludC1saWtlIG9iamVjdCAod2l0aCAueCBhbmQgLnkpIGlzIGNvbnRhaW5lZCBieSB0aGUgcmVjdFxuXHRjb250YWlucyggcG9pbnQgKSB7XG5cblx0XHRpZiAoIHBvaW50LnggPT09IHVuZGVmaW5lZCB8fCBwb2ludC55ID09PSB1bmRlZmluZWQgKSByZXR1cm47XG5cblx0XHRyZXR1cm4gcG9pbnQueCA8PSB0aGlzLm1heFggJiYgcG9pbnQueCA+PSB0aGlzLm1pblggJiYgcG9pbnQueSA8PSB0aGlzLm1heFkgJiYgcG9pbnQueSA+PSB0aGlzLm1pblk7XG5cblx0fVxuXG5cdGdldCBhcmVhKCkge1xuXG5cdFx0cmV0dXJuICggdGhpcy5tYXhYIC0gdGhpcy5taW5YICkgKiAoIHRoaXMubWF4WSAtIHRoaXMubWluWSApO1xuXG5cdH1cblxuXHRfZGlmZk9wdGltaXplZCggc2V0QSwgc2V0QiwgcHJvcCApIHtcblxuXHRcdGNvbnN0IGFVbmlxdWUgPSBbXSxcblx0XHRcdGJVbmlxdWUgPSBbXSxcblx0XHRcdHNoYXJlZCA9IFtdO1xuXG5cdFx0Zm9yICggbGV0IGkgPSAwLCBuID0gMDsgaSA8IHNldEEubGVuZ3RoICYmIG4gPCBzZXRCLmxlbmd0aDsgKSB7XG5cblx0XHRcdGlmICggc2V0QVsgaSBdWyBwcm9wIF0gPCBzZXRCWyBuIF1bIHByb3AgXSApIHtcblxuXHRcdFx0XHRhVW5pcXVlLnB1c2goIHNldEFbIGkgXSApO1xuXHRcdFx0XHRpICsrO1xuXG5cdFx0XHR9IGVsc2UgaWYgKCBzZXRBWyBpIF1bIHByb3AgXSA+IHNldEJbIG4gXVsgcHJvcCBdICkge1xuXG5cdFx0XHRcdGJVbmlxdWUucHVzaCggc2V0QlsgbiBdICk7XG5cdFx0XHRcdG4gKys7XG5cblx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0c2hhcmVkLnB1c2goIHNldEFbIGkgXSApO1xuXHRcdFx0XHRpICsrOyBuICsrO1xuXG5cdFx0XHR9XG5cblx0XHRcdGlmICggc2V0QVsgaSBdID09PSB1bmRlZmluZWQgJiYgbiA8IHNldEIubGVuZ3RoICkgYlVuaXF1ZS5wdXNoKCAuLi5zZXRCLnNsaWNlKCBuICkgKTtcblx0XHRcdGlmICggc2V0QlsgbiBdID09PSB1bmRlZmluZWQgJiYgaSA8IHNldEEubGVuZ3RoICkgYVVuaXF1ZS5wdXNoKCAuLi5zZXRBLnNsaWNlKCBpICkgKTtcblxuXHRcdH1cblxuXHRcdHJldHVybiBbIGFVbmlxdWUsIGJVbmlxdWUsIHNoYXJlZCBdO1xuXG5cdH1cblxuXHQvLyBBc3N1bWVzIG9yZGVyZWRcblx0ZGlmZiggc2V0QSwgc2V0QiwgY29tcGFyZSApIHtcblxuXHRcdGlmICggc2V0QS5sZW5ndGggPT09IDAgKSByZXR1cm4gW1tdLCBzZXRCLnNsaWNlKCAwICksIFtdXTtcblx0XHRpZiAoIHNldEIubGVuZ3RoID09PSAwICkgcmV0dXJuIFsgc2V0QS5zbGljZSggMCApLCBbXSwgW11dO1xuXG5cdFx0aWYgKCB0eXBlb2YgY29tcGFyZSAhPT0gXCJmdW5jdGlvblwiICkgcmV0dXJuIHRoaXMuX2RpZmZPcHRpbWl6ZWQoIHNldEEsIHNldEIsIGNvbXBhcmUgKTtcblxuXHRcdGNvbnN0IGFVbmlxdWUgPSBbXSxcblx0XHRcdGJVbmlxdWUgPSBbXSxcblx0XHRcdHNoYXJlZCA9IFtdO1xuXG5cdFx0Zm9yICggbGV0IGkgPSAwLCBuID0gMDsgaSA8IHNldEEubGVuZ3RoIHx8IG4gPCBzZXRCLmxlbmd0aDsgKSB7XG5cblx0XHRcdGNvbnN0IHJlbGF0aW9uID0gY29tcGFyZSggc2V0QVsgaSBdLCBzZXRCWyBpIF0gKTtcblxuXHRcdFx0aWYgKCByZWxhdGlvbiA8IDAgKSB7XG5cblx0XHRcdFx0YVVuaXF1ZS5wdXNoKCBzZXRBWyBpIF0gKTtcblx0XHRcdFx0aSArKztcblxuXHRcdFx0fSBlbHNlIGlmICggcmVsYXRpb24gPiAwICkge1xuXG5cdFx0XHRcdGJVbmlxdWUucHVzaCggc2V0QlsgbiBdICk7XG5cdFx0XHRcdG4gKys7XG5cblx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0c2hhcmVkLnB1c2goIHNldEFbIGkgXSApO1xuXHRcdFx0XHRpICsrOyBuICsrO1xuXG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gWyBhVW5pcXVlLCBiVW5pcXVlLCBzaGFyZWQgXTtcblxuXHR9XG5cblx0Y2FsY3VsYXRlRW50ZXIoIG9iaiApIHtcblxuXHRcdC8vIEFsc28sIGNoZWNrIHdoZW4gdGhlIHNoYWRvd1Byb3BzIHdlcmUgZGVmaW5lZCAoc3RhcnQpXG5cdFx0aWYgKCBvYmouc2hhZG93UHJvcHMgPT09IHVuZGVmaW5lZCB8fCAoIHR5cGVvZiBvYmouc2hhZG93UHJvcHMueCAhPT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBvYmouc2hhZG93UHJvcHMueSAhPT0gXCJmdW5jdGlvblwiICkgKVxuXHRcdFx0cmV0dXJuIE5hTjtcblxuXHRcdGlmICggb2JqLnNoYWRvd1Byb3BzLnggIT09IFwiZnVuY3Rpb25cIiApIHtcblxuXHRcdFx0aWYgKCBvYmouc2hhZG93UHJvcHMueS5yYXRlIDwgMCApIHJldHVybiBvYmouc2hhZG93UHJvcHMueS5zZWVrKCB0aGlzLm1heFkgKTtcblx0XHRcdHJldHVybiBvYmouc2hhZG93UHJvcHMueS5zZWVrKCB0aGlzLm1pblkgKTtcblxuXHRcdH0gZWxzZSBpZiAoIG9iai5zaGFkb3dQcm9wcy55ICE9PSBcImZ1bmN0aW9uXCIgKSB7XG5cblx0XHRcdGlmICggb2JqLnNoYWRvd1Byb3BzLngucmF0ZSA8IDAgKSByZXR1cm4gb2JqLnNoYWRvd1Byb3BzLnguc2VlayggdGhpcy5tYXhYICk7XG5cdFx0XHRyZXR1cm4gb2JqLnNoYWRvd1Byb3BzLnguc2VlayggdGhpcy5taW5YICk7XG5cblx0XHR9XG5cblx0XHRjb25zdCB4RGVsdGEgPSBvYmouc2hhZG93UHJvcHMueC5yYXRlIDwgMCA/IE1hdGguYWJzKCBvYmoueCAtIHRoaXMubWF4WCApIDogTWF0aC5hYnMoIG9iai54IC0gdGhpcy5taW5YICksXG5cdFx0XHR5RGVsdGEgPSBvYmouc2hhZG93UHJvcHMueS5yYXRlIDwgMCA/IE1hdGguYWJzKCBvYmoueSAtIHRoaXMubWF4WSApIDogTWF0aC5hYnMoIG9iai55IC0gdGhpcy5taW5ZICk7XG5cblx0XHRyZXR1cm4geERlbHRhIDwgeURlbHRhID9cblx0XHRcdG9iai5zaGFkb3dQcm9wcy54LnNlZWsoIG9iai5zaGFkb3dQcm9wcy54LnJhdGUgPCAwID8gdGhpcy5tYXhYIDogdGhpcy5taW5YICkgOlxuXHRcdFx0b2JqLnNoYWRvd1Byb3BzLnkuc2Vlayggb2JqLnNoYWRvd1Byb3BzLnkucmF0ZSA8IDAgPyB0aGlzLm1heFkgOiB0aGlzLm1pblkgKTtcblxuXHR9XG5cblx0Y2FsY3VsYXRlTGVhdmUoIG9iaiApIHtcblxuXHRcdC8vIEFsc28sIGNoZWNrIHdoZW4gdGhlIHNoYWRvd1Byb3BzIHdlcmUgZGVmaW5lZCAoc3RhcnQpXG5cdFx0aWYgKCBvYmouc2hhZG93UHJvcHMgPT09IHVuZGVmaW5lZCB8fCAoIHR5cGVvZiBvYmouc2hhZG93UHJvcHMueCAhPT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBvYmouc2hhZG93UHJvcHMueSAhPT0gXCJmdW5jdGlvblwiICkgKSB7XG5cblx0XHRcdGlmICggdGhpcy5hcHAgKSByZXR1cm4gdGhpcy5hcHAudGltZTtcblx0XHRcdHJldHVybiBOYU47XG5cblx0XHR9XG5cblx0XHRpZiAoIHR5cGVvZiBvYmouc2hhZG93UHJvcHMueCAhPT0gXCJmdW5jdGlvblwiICkge1xuXG5cdFx0XHRpZiAoIG9iai5zaGFkb3dQcm9wcy55LnJhdGUgPCAwICkgcmV0dXJuIG9iai5zaGFkb3dQcm9wcy55LnNlZWsoIHRoaXMubWluWSApO1xuXHRcdFx0cmV0dXJuIG9iai5zaGFkb3dQcm9wcy55LnNlZWsoIHRoaXMubWF4WSApO1xuXG5cdFx0fSBlbHNlIGlmICggdHlwZW9mIG9iai5zaGFkb3dQcm9wcy55ICE9PSBcImZ1bmN0aW9uXCIgKSB7XG5cblx0XHRcdGlmICggb2JqLnNoYWRvd1Byb3BzLngucmF0ZSA8IDAgKSByZXR1cm4gb2JqLnNoYWRvd1Byb3BzLnguc2VlayggdGhpcy5taW5YICk7XG5cdFx0XHRyZXR1cm4gb2JqLnNoYWRvd1Byb3BzLnguc2VlayggdGhpcy5tYXhYICk7XG5cblx0XHR9XG5cblx0XHRjb25zdCB4RGVsdGEgPSBvYmouc2hhZG93UHJvcHMueC5yYXRlIDwgMCA/IE1hdGguYWJzKCBvYmoueCAtIHRoaXMubWluWCApIDogTWF0aC5hYnMoIG9iai54IC0gdGhpcy5tYXhYICksXG5cdFx0XHR5RGVsdGEgPSBvYmouc2hhZG93UHJvcHMueS5yYXRlIDwgMCA/IE1hdGguYWJzKCBvYmoueSAtIHRoaXMubWluWSApIDogTWF0aC5hYnMoIG9iai55IC0gdGhpcy5tYXhZICk7XG5cblx0XHRyZXR1cm4geERlbHRhIDwgeURlbHRhID9cblx0XHRcdG9iai5zaGFkb3dQcm9wcy54LnNlZWsoIG9iai5zaGFkb3dQcm9wcy54LnJhdGUgPCAwID8gdGhpcy5taW5YIDogdGhpcy5tYXhYICkgOlxuXHRcdFx0b2JqLnNoYWRvd1Byb3BzLnkuc2Vlayggb2JqLnNoYWRvd1Byb3BzLnkucmF0ZSA8IDAgPyB0aGlzLm1pblkgOiB0aGlzLm1heFkgKTtcblxuXHR9XG5cblx0dG9KU09OKCkge1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdF9rZXk6IHRoaXMua2V5LFxuXHRcdFx0X2NvbGxlY3Rpb246IFwicmVjdHNcIlxuXHRcdH07XG5cblx0fVxuXG5cdHVwZGF0ZSgpIHtcblxuXHRcdGlmICggISB0aGlzLmFyZWEgKSByZXR1cm47XG5cblx0XHRsZXQgdW5pdHM7XG5cblx0XHRpZiAoIHRoaXMudGVycmFpbiApIHVuaXRzID0gdGhpcy50ZXJyYWluLnNlbGVjdFVuaXRzQm91bmRlZEJ5UmVjdGFuZ2xlKCB0aGlzICk7XG5cdFx0ZWxzZSBpZiAoIHRoaXMuYXBwICYmIHRoaXMuYXBwLnRlcnJhaW4gKSB1bml0cyA9IHRoaXMuYXBwLnRlcnJhaW4uc2VsZWN0VW5pdHNCb3VuZGVkQnlSZWN0YW5nbGUoIHRoaXMgKTtcblx0XHRlbHNlIGlmICggdGhpcy5jYW5kaWRhdGVVbml0cyApIHVuaXRzID0gdGhpcy5jYW5kaWRhdGVVbml0cy5maWx0ZXIoIHVuaXQgPT4gdGhpcy5jb250YWlucyggdW5pdCApICk7XG5cdFx0ZWxzZSByZXR1cm4gY29uc29sZS5lcnJvciggXCJObyBzb3VyY2Ugb2YgdW5pdHMuXCIgKTtcblxuXHRcdHVuaXRzLnNvcnQoICggYSwgYiApID0+IGEuaWQgPiBiLmlkICk7XG5cblx0XHRjb25zdCBbIGVudGVycywgbGVhdmVzIF0gPSB0aGlzLmRpZmYoIHVuaXRzLCB0aGlzLnVuaXRzLCBcImlkXCIgKTtcblxuXHRcdC8vIGNvbnNvbGUubG9nKCB0aGlzLnVuaXRzLmxlbmd0aCwgdW5pdHMubGVuZ3RoLCBlbnRlcnMubGVuZ3RoLCBsZWF2ZXMubGVuZ3RoLCBzYW1lLmxlbmd0aCApO1xuXG5cdFx0dGhpcy51bml0cyA9IHVuaXRzO1xuXG5cdFx0aWYgKCBlbnRlcnMubGVuZ3RoID09PSAwICYmIGxlYXZlcy5sZW5ndGggPT09IDAgKSByZXR1cm47XG5cblx0XHQvLyBjb25zb2xlLmxvZyggZW50ZXJzLnJlZHVjZSggKCBjb2wsIHUgKSA9PiAoIGNvbFsgdS5jb25zdHJ1Y3Rvci5uYW1lIF0gPyArKyBjb2xbIHUuY29uc3RydWN0b3IubmFtZSBdIDogY29sWyB1LmNvbnN0cnVjdG9yLm5hbWUgXSA9IDEsIGNvbCApLCB7fSApLFxuXHRcdC8vIFx0bGVhdmVzLnJlZHVjZSggKCBjb2wsIHUgKSA9PiAoIGNvbFsgdS5jb25zdHJ1Y3Rvci5uYW1lIF0gPyArKyBjb2xbIHUuY29uc3RydWN0b3IubmFtZSBdIDogY29sWyB1LmNvbnN0cnVjdG9yLm5hbWUgXSA9IDEsIGNvbCApLCB7fSApICk7XG5cblx0XHRjb25zdCBzdWJldmVudHMgPSBbXTtcblxuXHRcdGZvciAoIGxldCBpID0gMDsgaSA8IGVudGVycy5sZW5ndGg7IGkgKysgKVxuXHRcdFx0c3ViZXZlbnRzLnB1c2goIHsgdHlwZTogXCJ1bml0RW50ZXJcIiwgdW5pdDogZW50ZXJzWyBpIF0sIHRpbWU6IHRoaXMuY2FsY3VsYXRlRW50ZXIoIGVudGVyc1sgaSBdICksIHRhcmdldDogdGhpcyB9ICk7XG5cblx0XHRmb3IgKCBsZXQgaSA9IDA7IGkgPCBsZWF2ZXMubGVuZ3RoOyBpICsrIClcblx0XHRcdHN1YmV2ZW50cy5wdXNoKCB7IHR5cGU6IFwidW5pdExlYXZlXCIsIHVuaXQ6IGxlYXZlc1sgaSBdLCB0aW1lOiB0aGlzLmNhbGN1bGF0ZUxlYXZlKCBsZWF2ZXNbIGkgXSApLCB0YXJnZXQ6IHRoaXMgfSApO1xuXG5cdFx0aWYgKCB0aGlzLmFwcCApIHJldHVybiB0aGlzLmFwcC5zdWJldmVudHMucHVzaCggLi4uc3ViZXZlbnRzICk7XG5cblx0XHRzdWJldmVudHMuc29ydCggKCBhLCBiICkgPT4gYS50aW1lIC0gYi50aW1lICk7XG5cblx0XHRmb3IgKCBsZXQgaSA9IDA7IGkgPCBzdWJldmVudHMubGVuZ3RoOyBpICsrIClcblx0XHRcdHRoaXMuZGlzcGF0Y2hFdmVudCggc3ViZXZlbnRzWyBpIF0gKTtcblxuXHR9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgUmVjdDtcbiIsIlxuY29uc3Qgc3RyaW5naWZ5ID0gdmFsdWUgPT4gdmFsdWUgPT09IEluZmluaXR5ID8gXCJfX0luZmluaXR5XCIgOiB2YWx1ZSA9PT0gLSBJbmZpbml0eSA/IFwiX18tSW5maW5pdHlcIiA6IHZhbHVlO1xuY29uc3QgcGFyc2UgPSB2YWx1ZSA9PiB2YWx1ZSA9PT0gXCJfX0luZmluaXR5XCIgPyBJbmZpbml0eSA6IHZhbHVlID09PSBcIl9fLUluZmluaXR5XCIgPyAtIEluZmluaXR5IDogdmFsdWU7XG5cbmZ1bmN0aW9uIGxpbmVhclR3ZWVuKCB7IHN0YXJ0ID0gMCwgZW5kID0gMSwgcmF0ZSwgZHVyYXRpb24sIHN0YXJ0VGltZSA9IERhdGUubm93KCkgfSA9IHt9ICkge1xuXG5cdC8vIGNvbnNvbGUubG9nKCBcImxpbmVhclR3ZWVuXCIgKTtcblxuXHRpZiAoIHR5cGVvZiBkdXJhdGlvbiA9PT0gXCJzdHJpbmdcIiApIGR1cmF0aW9uID0gcGFyc2UoIGR1cmF0aW9uICk7XG5cblx0Y29uc3QgZGlmZiA9IGVuZCAtIHN0YXJ0O1xuXG5cdGlmICggcmF0ZSA9PT0gdW5kZWZpbmVkICkge1xuXG5cdFx0aWYgKCBkdXJhdGlvbiA9PT0gSW5maW5pdHkgKSByYXRlID0gMTtcblx0XHRlbHNlIHJhdGUgPSBkaWZmIC8gZHVyYXRpb247XG5cblx0fVxuXG5cdGlmICggZHVyYXRpb24gPT09IHVuZGVmaW5lZCApIGR1cmF0aW9uID0gZGlmZiAvIHJhdGU7XG5cblx0Y29uc3QgZnVuYyA9ICggdGltZSA9IERhdGUubm93KCkgKSA9PiB7XG5cblx0XHRjb25zdCBkZWx0YSA9ICggdGltZSAtIHN0YXJ0VGltZSApIC8gMTAwMDtcblxuXHRcdGlmICggZGVsdGEgPj0gZHVyYXRpb24gKSByZXR1cm4gZW5kO1xuXG5cdFx0cmV0dXJuIHN0YXJ0ICsgZGVsdGEgKiByYXRlO1xuXG5cdH07XG5cblx0T2JqZWN0LmFzc2lnbiggZnVuYywge1xuXHRcdHN0YXJ0LCBlbmQsIHJhdGUsIGR1cmF0aW9uLCBzdGFydFRpbWUsIGRpZmYsXG5cdFx0c2VlazogdmFsdWUgPT4gKCB2YWx1ZSAtIHN0YXJ0ICkgLyByYXRlICogMTAwMCArIHN0YXJ0VGltZSxcblx0XHR0b1N0YXRlOiAoKSA9PiAoIHsgX2Z1bmN0aW9uOiBcImxpbmVhclR3ZWVuXCIsIHN0YXJ0LCBlbmQsIHJhdGUsIGR1cmF0aW9uOiBzdHJpbmdpZnkoIGR1cmF0aW9uICksIHN0YXJ0VGltZSB9IClcblx0fSApO1xuXG5cdHJldHVybiBmdW5jO1xuXG59XG5cbmV4cG9ydCBkZWZhdWx0IGxpbmVhclR3ZWVuO1xuIiwiXG4vLyBBY3R1YWxseSB1c2VkIGJ5IEFwcFxuXG5pbXBvcnQgQ29sbGVjdGlvbiBmcm9tIFwiLi9Db2xsZWN0aW9uLmpzXCI7XG5pbXBvcnQgRXZlbnREaXNwYXRjaGVyIGZyb20gXCIuL0V2ZW50RGlzcGF0Y2hlci5qc1wiO1xuaW1wb3J0IFBsYXllciBmcm9tIFwiLi9QbGF5ZXIuanNcIjtcbmltcG9ydCB0aW1lUHJvcGVydHkgZnJvbSBcIi4vdGltZVByb3BlcnR5LmpzXCI7XG5cbmltcG9ydCBtb2RlbHMgZnJvbSBcIi4uL2VudGl0aWVzL21vZGVscy5qc1wiO1xuaW1wb3J0IFRlcnJhaW4gZnJvbSBcIi4uL2VudGl0aWVzL1RlcnJhaW4uanNcIjtcbmltcG9ydCBVbml0IGZyb20gXCIuLi9lbnRpdGllcy9Vbml0LmpzXCI7XG5pbXBvcnQgRG9vZGFkIGZyb20gXCIuLi9lbnRpdGllcy9Eb29kYWQuanNcIjtcbmltcG9ydCAqIGFzIGVudiBmcm9tIFwiLi4vbWlzYy9lbnYuanNcIjtcbmltcG9ydCBmZXRjaEZpbGUgZnJvbSBcIi4uL21pc2MvZmV0Y2hGaWxlLmpzXCI7XG5cbmltcG9ydCBSYW5kb20gZnJvbSBcIi4uLy4uL2xpYi9zZWVkcmFuZG9tLWFsZWEuanNcIjtcblxuaW1wb3J0ICogYXMgcnRzIGZyb20gXCIuLi9wcmVzZXRzL3J0cy5qc1wiO1xuXG4vLyBXcmFwcGVkIGJ5IEFwcFxuaW1wb3J0IFJlY3QgZnJvbSBcIi4uL21pc2MvUmVjdC5qc1wiO1xuaW1wb3J0ICogYXMgdHdlZW5zIGZyb20gXCIuLi90d2VlbnMvdHdlZW5zLmpzXCI7XG5cbmNvbnN0IGV2YWwyID0gZXZhbDtcblxuY2xhc3MgQXBwIGV4dGVuZHMgRXZlbnREaXNwYXRjaGVyIHtcblxuXHRjb25zdHJ1Y3RvciggcHJvcHMgPSB7fSApIHtcblxuXHRcdHN1cGVyKCk7XG5cblx0XHR0aGlzLnN0YXRlID0ge307XG5cblx0XHQvLyBUaW1lIGtlZXBpbmdcblx0XHR0aGlzLnRpbWUgPSAwO1xuXHRcdHRoaXMucmVuZGVyVGltZSA9IDA7XG5cdFx0dGhpcy5sYXN0Tm93ID0gRGF0ZS5ub3coKTtcblx0XHR0aGlzLmxhc3RSZW5kZXIgPSB0aGlzLmxhc3ROb3c7XG5cblx0XHQvLyBSYW5kb21uZXNzXG5cdFx0dGhpcy5pbml0aWFsU2VlZCA9IHByb3BzLnNlZWQgfHwgXCJ3ZWJjcmFmdFwiO1xuXHRcdHRpbWVQcm9wZXJ0eSggdGhpcywgdGhpcywgXCJyYW5kb21cIiwgdHJ1ZSApO1xuXHRcdHRoaXMucmFuZG9tID0gbmV3IFJhbmRvbSggdGhpcy5pbml0aWFsU2VlZCApO1xuXG5cdFx0Ly8gQ29sbGVjdGlvbnMgJiBBcnJheXNcblx0XHR0aGlzLmhhbmRsZXMgPSBwcm9wcy5oYW5kbGVzIHx8IG5ldyBDb2xsZWN0aW9uKCk7XG5cdFx0dGhpcy5wbGF5ZXJzID0gcHJvcHMucGxheWVycyB8fCBuZXcgQ29sbGVjdGlvbigpO1xuXHRcdHRoaXMudW5pdHMgPSBwcm9wcy51bml0cyB8fCBuZXcgQ29sbGVjdGlvbigpO1xuXHRcdHRoaXMuZG9vZGFkcyA9IHByb3BzLmRvb2RhZHMgfHwgbmV3IENvbGxlY3Rpb24oKTtcblx0XHR0aGlzLnJlY3RzID0gcHJvcHMucmVjdHMgfHwgbmV3IENvbGxlY3Rpb24oKTtcblx0XHR0aGlzLnVwZGF0ZXMgPSBwcm9wcy51cGRhdGVzIHx8IG5ldyBDb2xsZWN0aW9uKCk7XG5cdFx0dGhpcy5yZW5kZXJzID0gcHJvcHMucmVuZGVycyB8fCBuZXcgQ29sbGVjdGlvbigpO1xuXHRcdHRoaXMuc3ViZXZlbnRzID0gcHJvcHMuc3ViZXZlbnRzIHx8IFtdO1xuXG5cdFx0aWYgKCBlbnYuaXNTZXJ2ZXIgKSBPYmplY3QuZGVmaW5lUHJvcGVydHkoIHRoaXMsIFwib2ZmaWNpYWxUaW1lXCIsIHsgZ2V0OiAoKSA9PiB0aGlzLnRpbWUgfSApO1xuXG5cdFx0Ly8gSW5pdGlhbGl6ZSB0aGUgYXBwIGNvbXBvbmVudHNcblx0XHR0aGlzLmluaXRUZXJyYWluKCBwcm9wcy50ZXJyYWluICk7XG5cdFx0dGhpcy5pbml0U2NlbmUoIHByb3BzLnNjZW5lICk7XG5cdFx0dGhpcy5ldmVudFN5c3RlbSA9IE9iamVjdC5hc3NpZ24oIHt9LCBydHMuZXZlbnRTeXN0ZW0sIHByb3BzLmV2ZW50U3lzdGVtICk7XG5cdFx0dGhpcy5pbml0RmFjdG9yaWVzKCBwcm9wcy50eXBlcyApO1xuXHRcdHRoaXMuaW5pdE5ldHdvcmsoIHByb3BzLm5ldHdvcmsgKTtcblxuXHRcdC8vIEluaXRpYWx6ZSB0aGUgYXBwIGJyb3dzZXIgY29tcG9uZW50cyAoZ3JhcGhpY3MsIHVpLCBpbnRlbnRzKVxuXHRcdGlmICggZW52LmlzQnJvd3NlciApIHRoaXMuaW5pdEJyb3dzZXJDb21wb25lbnRzKCBwcm9wcyApO1xuXG5cdFx0Ly8gU3RhcnQgb3VyIHByaW1hcnkgbG9vcFxuXHRcdGlmICggZW52LmlzU2VydmVyICkgdGhpcy51cGRhdGUoKTtcblx0XHRpZiAoIGVudi5pc0Jyb3dzZXIgKSB0aGlzLnJlbmRlcigpO1xuXG5cdH1cblxuXHRpbml0VGVycmFpbiggcHJvcHMgKSB7XG5cblx0XHR0aGlzLnRlcnJhaW4gPSBwcm9wcyAmJiBwcm9wcy5jb25zdHJ1Y3RvciAhPT0gT2JqZWN0ID8gcHJvcHMgOiBuZXcgVGVycmFpbiggT2JqZWN0LmFzc2lnbiggeyBhcHA6IHRoaXMgfSwgcHJvcHMgKSApO1xuXG5cdH1cblxuXHRpbml0SW50ZW50U3lzdGVtKCBwcm9wcyApIHtcblxuXHRcdHRoaXMuaW50ZW50U3lzdGVtID0gcHJvcHMgJiYgcHJvcHMuY29uc3RydWN0b3IgIT09IE9iamVjdCA/IHByb3BzIDoge307XG5cblx0fVxuXG5cdGluaXRTY2VuZSggcHJvcHMgKSB7XG5cblx0XHR0aGlzLnNjZW5lID0gcHJvcHMgJiYgcHJvcHMgaW5zdGFuY2VvZiBUSFJFRS5TY2VuZSA/XG5cdFx0XHRwcm9wcyA6XG5cdFx0XHRuZXcgVEhSRUUuU2NlbmUoKTtcblxuXHRcdC8vIHRoaXMuZ2xvYmFsTGlnaHQgPSBuZXcgVEhSRUUuSGVtaXNwaGVyZUxpZ2h0KCAweGZmZmZiYiwgMHgwODA4MjAgKTtcblx0XHR0aGlzLmdsb2JhbExpZ2h0ID0gbmV3IFRIUkVFLkhlbWlzcGhlcmVMaWdodCggMHhmZmZmYmIsIDB4MDgwODIwICk7XG5cdFx0dGhpcy5zY2VuZS5hZGQoIHRoaXMuZ2xvYmFsTGlnaHQgKTtcblxuXHRcdHRoaXMuc3VuID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoIDB4ZmZmZmZmLCAwLjUgKTtcblx0XHR0aGlzLnN1bi5wb3NpdGlvbi56ID0gNTtcblx0XHR0aGlzLnN1bi5wb3NpdGlvbi54ID0gLSAzO1xuXHRcdHRoaXMuc3VuLnBvc2l0aW9uLnkgPSAtIDc7XG5cdFx0dGhpcy5zY2VuZS5hZGQoIHRoaXMuc3VuICk7XG5cblx0fVxuXG5cdGluaXRCcm93c2VyQ29tcG9uZW50cyggcHJvcHMgKSB7XG5cblx0XHR0aGlzLmludGVudFN5c3RlbSA9IE9iamVjdC5hc3NpZ24oIHt9LCBwcm9wcy5pbnRlbnRTeXN0ZW0gKTtcblxuXHRcdHRoaXMuaW5pdENhbWVyYSggcHJvcHMuY2FtZXJhICk7XG5cdFx0dGhpcy5yZW5kZXJlciA9IHByb3BzLnJlbmRlcmVyICYmIHByb3BzLnJlbmRlcmVyLmNvbnN0cnVjdG9yICE9PSBPYmplY3QgPyBwcm9wcy5yZW5kZXJlciA6IHJ0cy5yZW5kZXJlciggcHJvcHMucmVuZGVyZXIgKTtcblxuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCBcInJlc2l6ZVwiLCAoKSA9PiB0aGlzLmNhbWVyYS5yZXNpemUoKSApO1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCBcImtleWRvd25cIiwgZSA9PiB0aGlzLmludGVudFN5c3RlbS5rZXlkb3duICYmIHRoaXMuaW50ZW50U3lzdGVtLmtleWRvd24oIGUgKSApO1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCBcImtleXVwXCIsIGUgPT4gdGhpcy5pbnRlbnRTeXN0ZW0ua2V5dXAgJiYgdGhpcy5pbnRlbnRTeXN0ZW0ua2V5dXAoIGUgKSApO1xuXG5cdH1cblxuXHRpbml0Q2FtZXJhKCBwcm9wcyApIHtcblxuXHRcdHRoaXMuY2FtZXJhID0gcHJvcHMgJiYgcHJvcHMgaW5zdGFuY2VvZiBUSFJFRS5DYW1lcmEgP1xuXHRcdFx0cHJvcHMgOlxuXHRcdFx0bmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKCA1MCwgd2luZG93LmlubmVyV2lkdGggLyB3aW5kb3cuaW5uZXJIZWlnaHQsIDAuMSwgMTAwMDAgKTtcblxuXHRcdC8vIHRoaXMuY2FtZXJhLnJlc2l6ZSA9ICgpID0+IHRoaXMuY2FtZXJhLmFzcGVjdCA9IHdpbmRvdy5pbm5lcldpZHRoIC8gd2luZG93LmlubmVySGVpZ2h0O1xuXHRcdHRoaXMuY2FtZXJhLnJlc2l6ZSA9ICgpID0+IHtcblxuXHRcdFx0dGhpcy5jYW1lcmEuYXNwZWN0ID0gd2luZG93LmlubmVyV2lkdGggLyB3aW5kb3cuaW5uZXJIZWlnaHQ7XG5cdFx0XHR0aGlzLmNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XG5cblx0XHRcdHRoaXMucmVuZGVyZXIuc2V0U2l6ZSggd2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCApO1xuXG5cdFx0fTtcblxuXHRcdHRoaXMuY2FtZXJhLnBvc2l0aW9uLnogPSAyNTtcblxuXHR9XG5cblx0aW5pdE5ldHdvcmsoIHByb3BzID0ge30gKSB7XG5cblx0XHRpZiAoIHByb3BzLnJldml2ZXIgPT09IHVuZGVmaW5lZCApXG5cdFx0XHRwcm9wcy5yZXZpdmVyID0gKCBrZXksIHZhbHVlICkgPT4ge1xuXG5cdFx0XHRcdC8vIGlmICgga2V5IHx8IHR5cGVvZiB2YWx1ZSAhPT0gXCJudW1iZXJcIiApXG5cdFx0XHRcdC8vIFx0Y29uc29sZS5sb2coIFwicmV2aXZlclwiLCBrZXksIHZhbHVlICk7XG5cblx0XHRcdFx0Ly8gUHJpbWl0aXZlXG5cdFx0XHRcdGlmICggdmFsdWUgPT0gbnVsbCB8fCB0eXBlb2YgdmFsdWUgIT09IFwib2JqZWN0XCIgKSByZXR1cm4gdmFsdWU7XG5cblx0XHRcdFx0aWYgKCB2YWx1ZS5fY29sbGVjdGlvbiAhPT0gdW5kZWZpbmVkICYmIHZhbHVlLl9rZXkgIT09IHVuZGVmaW5lZCApIHtcblxuXHRcdFx0XHRcdC8vIFRyeSBmZXRjaGluZyBmcm9tIGNvbGxlY3Rpb25cblx0XHRcdFx0XHRsZXQgb2JqID0gdGhpc1sgdmFsdWUuX2NvbGxlY3Rpb24gXS5kaWN0WyB2YWx1ZS5fa2V5IF07XG5cblx0XHRcdFx0XHQvLyBDcmVhdGUgaXQgaWYgcmVjb25naXplZCBjb25zdHJ1Y3RvclxuXHRcdFx0XHRcdGlmICggISBvYmogJiYgdmFsdWUuX2NvbnN0cnVjdG9yIClcblx0XHRcdFx0XHRcdG9iaiA9IG5ldyB0aGlzWyB2YWx1ZS5fY29uc3RydWN0b3IgXSggeyBrZXk6IHZhbHVlLl9rZXkgfSApO1xuXG5cdFx0XHRcdFx0Ly8gRXhwYW5kIG91dCBwcm9wZXJ0aWVzXG5cdFx0XHRcdFx0Zm9yICggY29uc3QgcHJvcCBpbiB2YWx1ZSApXG5cdFx0XHRcdFx0XHRpZiAoIFsgXCJfa2V5XCIsIFwiX2NvbGxlY3Rpb25cIiwgXCJfY29uc3RydWN0b3JcIiwgXCJfZnVuY3Rpb25cIiBdLmluZGV4T2YoIHByb3AgKSA9PT0gLSAxIClcblx0XHRcdFx0XHRcdFx0dmFsdWVbIHByb3AgXSA9IHByb3BzLnJldml2ZXIoIHByb3AsIHZhbHVlWyBwcm9wIF0gKTtcblxuXHRcdFx0XHRcdC8vIEFwcGx5IHByb3BlcnRpZXNcblx0XHRcdFx0XHRpZiAoIG9iaiApXG5cdFx0XHRcdFx0XHRmb3IgKCBjb25zdCBwcm9wIGluIHZhbHVlIClcblx0XHRcdFx0XHRcdFx0aWYgKCBbIFwiX2tleVwiLCBcIl9jb2xsZWN0aW9uXCIsIFwiX2NvbnN0cnVjdG9yXCIsIFwiX2Z1bmN0aW9uXCIgXS5pbmRleE9mKCBcInByb3BcIiApID09PSAtIDEgKVxuXHRcdFx0XHRcdFx0XHRcdG9ialsgcHJvcCBdID0gdmFsdWVbIHByb3AgXTtcblxuXHRcdFx0XHRcdHJldHVybiBvYmo7XG5cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIE5vdCBjb2xsZWN0YWJsZSwgYnV0IHN0aWxsIGEgY29uc3RydWN0YWJsZVxuXHRcdFx0XHRpZiAoIHZhbHVlLl9jb25zdHJ1Y3RvciApIHtcblxuXHRcdFx0XHRcdGNvbnN0IG9iaiA9IG5ldyB0aGlzWyB2YWx1ZS5fY29uc3RydWN0b3IgXSggeyBrZXk6IHZhbHVlLl9rZXkgfSApO1xuXG5cdFx0XHRcdFx0Zm9yICggY29uc3QgcHJvcCBpbiB2YWx1ZSApXG5cdFx0XHRcdFx0XHRpZiAoIFsgXCJfa2V5XCIsIFwiX2NvbGxlY3Rpb25cIiwgXCJfY29uc3RydWN0b3JcIiwgXCJfZnVuY3Rpb25cIiBdLmluZGV4T2YoIHByb3AgKSA9PT0gLSAxIClcblx0XHRcdFx0XHRcdFx0dmFsdWVbIHByb3AgXSA9IHByb3BzLnJldml2ZXIoIHByb3AsIHZhbHVlWyBwcm9wIF0gKTtcblxuXHRcdFx0XHRcdGlmICggb2JqIClcblx0XHRcdFx0XHRcdGZvciAoIGNvbnN0IHByb3AgaW4gdmFsdWUgKVxuXHRcdFx0XHRcdFx0XHRpZiAoIFsgXCJfa2V5XCIsIFwiX2NvbGxlY3Rpb25cIiwgXCJfY29uc3RydWN0b3JcIiwgXCJfZnVuY3Rpb25cIiBdLmluZGV4T2YoIFwicHJvcFwiICkgPT09IC0gMSApXG5cdFx0XHRcdFx0XHRcdFx0b2JqWyBwcm9wIF0gPSB2YWx1ZVsgcHJvcCBdO1xuXG5cdFx0XHRcdFx0cmV0dXJuIG9iajtcblxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gQSBmdW5jdGlvbiB3aXRob3V0IGFwcGxpZWQgcHJvcGVydGllc1xuXHRcdFx0XHRpZiAoIHZhbHVlLl9mdW5jdGlvbiApIHJldHVybiB0aGlzWyB2YWx1ZS5fZnVuY3Rpb24gXSggdmFsdWUgKTtcblxuXHRcdFx0XHRyZXR1cm4gdmFsdWU7XG5cblx0XHRcdH07XG5cblx0XHRpZiAoIGVudi5pc1NlcnZlciApIHRoaXMuaW5pdFNlcnZlck5ldHdvcmsoIHByb3BzICk7XG5cdFx0ZWxzZSB0aGlzLmluaXRDbGllbnROZXR3b3JrKCBwcm9wcyApO1xuXG5cdFx0dGhpcy5hZGRFdmVudExpc3RlbmVyKCBcInBsYXllckpvaW5cIiwgZSA9PiB0aGlzLmV2ZW50U3lzdGVtLnBsYXllckpvaW5IYW5kbGVyKCB0aGlzLCBlICkgKTtcblx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoIFwicGxheWVyTGVhdmVcIiwgZSA9PiB0aGlzLmV2ZW50U3lzdGVtLnBsYXllckxlYXZlSGFuZGxlciggdGhpcywgZSApICk7XG5cdFx0dGhpcy5hZGRFdmVudExpc3RlbmVyKCBcInN0YXRlXCIsIGUgPT4gdGhpcy5ldmVudFN5c3RlbS5zdGF0ZSggdGhpcywgZSApICk7XG5cblx0fVxuXG5cdGluaXRTZXJ2ZXJOZXR3b3JrKCBwcm9wcyA9IHt9ICkge1xuXG5cdFx0dGhpcy5uZXR3b3JrID0gcHJvcHMuY29uc3RydWN0b3IgIT09IE9iamVjdCA/XG5cdFx0XHRwcm9wcyA6XG5cdFx0XHRuZXcgcnRzLlNlcnZlck5ldHdvcmsoIE9iamVjdC5hc3NpZ24oIHsgcGxheWVyczogdGhpcy5wbGF5ZXJzIH0sIHByb3BzICkgKTtcblxuXHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lciggXCJjbGllbnRKb2luXCIsIGUgPT4gdGhpcy5ldmVudFN5c3RlbS5jbGllbnRKb2luSGFuZGxlciggdGhpcywgZSApICk7XG5cdFx0dGhpcy5hZGRFdmVudExpc3RlbmVyKCBcImNsaWVudExlYXZlXCIsIGUgPT4gdGhpcy5ldmVudFN5c3RlbS5jbGllbnRMZWF2ZUhhbmRsZXIoIHRoaXMsIGUgKSApO1xuXHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lciggXCJjbGllbnRNZXNzYWdlXCIsIGUgPT4gdGhpcy5ldmVudFN5c3RlbS5jbGllbnRNZXNzYWdlSGFuZGxlciggdGhpcywgZSApICk7XG5cblx0XHR0aGlzLm5ldHdvcmsuYXBwID0gdGhpcztcblxuXHR9XG5cblx0aW5pdENsaWVudE5ldHdvcmsoIHByb3BzID0ge30gKSB7XG5cblx0XHR0aGlzLm5ldHdvcmsgPSBwcm9wcyAmJiBwcm9wcy5jb25zdHJ1Y3RvciAhPT0gT2JqZWN0ID9cblx0XHRcdHByb3BzIDpcblx0XHRcdG5ldyBydHMuQ2xpZW50TmV0d29yayggcHJvcHMgKTtcblxuXHRcdHRoaXMubmV0d29yay5hcHAgPSB0aGlzO1xuXG5cdH1cblxuXHRpbml0RmFjdG9yaWVzKCB0eXBlcyApIHtcblxuXHRcdGNvbnN0IGFwcCA9IHRoaXM7XG5cblx0XHR0aGlzLlBsYXllciA9IGNsYXNzIGV4dGVuZHMgUGxheWVyIHtcblxuXHRcdFx0Y29uc3RydWN0b3IoIHByb3BzICkge1xuXG5cdFx0XHRcdHN1cGVyKCBPYmplY3QuYXNzaWduKCB7IGFwcCB9LCBwcm9wcyApICk7XG5cblx0XHRcdFx0YXBwLnBsYXllcnMuYWRkKCB0aGlzICk7XG5cdFx0XHRcdGFwcC5wbGF5ZXJzLnNvcnQoICggYSwgYiApID0+IGEuaWQgPiBiLmlkID8gMSA6IC0gMSApO1xuXG5cdFx0XHR9XG5cblx0XHR9O1xuXG5cdFx0Zm9yICggY29uc3QgdHdlZW4gaW4gdHdlZW5zIClcblx0XHRcdHRoaXNbIHR3ZWVuIF0gPSBvYmogPT4gdHdlZW5zWyB0d2VlbiBdKCBPYmplY3QuYXNzaWduKCB7IHN0YXJ0VGltZTogdGhpcy50aW1lIH0sIG9iaiApICk7XG5cblx0XHR0aGlzLlJlY3QgPSBjbGFzcyBleHRlbmRzIFJlY3Qge1xuXG5cdFx0XHRjb25zdHJ1Y3RvciggLi4uYXJncyApIHtcblxuXHRcdFx0XHRzdXBlciggLi4uYXJncyApO1xuXG5cdFx0XHRcdGlmICggdGhpcy5hcHAgPT09IHVuZGVmaW5lZCApIHRoaXMuYXBwID0gYXBwO1xuXG5cdFx0XHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lciggXCJkaXJ0eVwiLCAoKSA9PiBhcHAudXBkYXRlcy5hZGQoIHRoaXMgKSApO1xuXHRcdFx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoIFwiY2xlYW5cIiwgKCkgPT4gYXBwLnVwZGF0ZXMucmVtb3ZlKCB0aGlzICkgKTtcblxuXHRcdFx0fVxuXG5cdFx0fTtcblxuXHRcdGlmICggdHlwZXMgKSB0aGlzLmxvYWRUeXBlcyggdHlwZXMgKTtcblxuXHR9XG5cblx0bG9hZFR5cGVzKCB0eXBlcyApIHtcblxuXHRcdGlmICggdHlwZXMudW5pdHMgKSB0aGlzLmxvYWRVbml0VHlwZXMoIHR5cGVzLnVuaXRzICk7XG5cdFx0aWYgKCB0eXBlcy5kb29kYWRzICkgdGhpcy5sb2FkRG9vZGFkVHlwZXMoIHR5cGVzLmRvb2RhZHMgKTtcblxuXHR9XG5cblx0bG9hZFVuaXRUeXBlcyggdHlwZXMgKSB7XG5cblx0XHRmb3IgKCBsZXQgaSA9IDA7IGkgPCB0eXBlcy5sZW5ndGg7IGkgKysgKVxuXHRcdFx0dGhpcy5sb2FkVW5pdFR5cGUoIHR5cGVzWyBpIF0gKTtcblxuXHR9XG5cblx0bG9hZERvb2RhZFR5cGVzKCB0eXBlcyApIHtcblxuXHRcdGZvciAoIGxldCBpID0gMDsgaSA8IHR5cGVzLmxlbmd0aDsgaSArKyApXG5cdFx0XHR0aGlzLmxvYWREb29kYWRUeXBlKCB0eXBlc1sgaSBdICk7XG5cblx0fVxuXG5cdGxvYWRVbml0VHlwZSggdHlwZSApIHtcblxuXHRcdGNvbnN0IGFwcCA9IHRoaXM7XG5cblx0XHRpZiAoIG1vZGVsc1sgdHlwZS5tb2RlbCBdID09PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdG1vZGVsc1sgdHlwZS5tb2RlbCBdID0gbmV3IEV2ZW50RGlzcGF0Y2hlcigpO1xuXHRcdFx0ZmV0Y2hGaWxlKCB0eXBlLm1vZGVsIClcblx0XHRcdFx0LnRoZW4oIGZpbGUgPT4ge1xuXG5cdFx0XHRcdFx0Y29uc3QgZXZlbnREaXNwYXRjaGVyID0gbW9kZWxzWyB0eXBlLm1vZGVsIF07XG5cblx0XHRcdFx0XHRtb2RlbHNbIHR5cGUubW9kZWwgXSA9IGV2YWwyKCBmaWxlICk7XG5cblx0XHRcdFx0XHRldmVudERpc3BhdGNoZXIuZGlzcGF0Y2hFdmVudCggeyB0eXBlOiBcInJlYWR5XCIsIG1vZGVsOiBtb2RlbHNbIHR5cGUubW9kZWwgXSB9ICk7XG5cblx0XHRcdFx0fSApXG5cdFx0XHRcdC5jYXRjaCggZXJyID0+IGNvbnNvbGUuZXJyb3IoIGVyciApICk7XG5cblx0XHR9XG5cblx0XHR0aGlzWyB0eXBlLm5hbWUgXSA9IGNsYXNzIGV4dGVuZHMgVW5pdCB7XG5cblx0XHRcdGNvbnN0cnVjdG9yKCBwcm9wcyApIHtcblxuXHRcdFx0XHRzdXBlciggT2JqZWN0LmFzc2lnbiggeyBhcHAgfSwgdHlwZSwgcHJvcHMgKSApO1xuXG5cdFx0XHRcdGFwcC51bml0cy5hZGQoIHRoaXMgKTtcblxuXHRcdFx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoIFwibWVzaExvYWRlZFwiLCAoKSA9PiBhcHAuc2NlbmUuYWRkKCB0aGlzLm1lc2ggKSApO1xuXHRcdFx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoIFwibWVzaFVubG9hZGVkXCIsICgpID0+IGFwcC5zY2VuZS5yZW1vdmUoIHRoaXMubWVzaCApICk7XG5cblx0XHRcdFx0dGhpcy5hZGRFdmVudExpc3RlbmVyKCBcImRpcnR5XCIsICgpID0+ICggYXBwLnVwZGF0ZXMuYWRkKCB0aGlzICksIGFwcC5yZW5kZXJzLmFkZCggdGhpcyApICkgKTtcblx0XHRcdFx0dGhpcy5hZGRFdmVudExpc3RlbmVyKCBcImNsZWFuXCIsICgpID0+ICggYXBwLnVwZGF0ZXMucmVtb3ZlKCB0aGlzICksIGFwcC5yZW5kZXJzLnJlbW92ZSggdGhpcyApICkgKTtcblxuXHRcdFx0fVxuXG5cdFx0XHRzdGF0aWMgZ2V0IG5hbWUoKSB7XG5cblx0XHRcdFx0cmV0dXJuIHR5cGUubmFtZTtcblxuXHRcdFx0fVxuXG5cdFx0fTtcblxuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggdGhpc1sgdHlwZS5uYW1lIF0uY29uc3RydWN0b3IsIFwibmFtZVwiLCB7IHZhbHVlOiB0eXBlLm5hbWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9ICk7XG5cblx0fVxuXG5cdGxvYWREb29kYWRUeXBlKCB0eXBlICkge1xuXG5cdFx0Y29uc3QgYXBwID0gdGhpcztcblxuXHRcdGlmICggbW9kZWxzWyB0eXBlLm1vZGVsIF0gPT09IHVuZGVmaW5lZCApIHtcblxuXHRcdFx0bW9kZWxzWyB0eXBlLm1vZGVsIF0gPSBuZXcgRXZlbnREaXNwYXRjaGVyKCk7XG5cdFx0XHRmZXRjaEZpbGUoIHR5cGUubW9kZWwgKVxuXHRcdFx0XHQudGhlbiggZmlsZSA9PiB7XG5cblx0XHRcdFx0XHRjb25zdCBldmVudERpc3BhdGNoZXIgPSBtb2RlbHNbIHR5cGUubW9kZWwgXTtcblxuXHRcdFx0XHRcdG1vZGVsc1sgdHlwZS5tb2RlbCBdID0gZXZhbDIoIGZpbGUgKTtcblxuXHRcdFx0XHRcdGV2ZW50RGlzcGF0Y2hlci5kaXNwYXRjaEV2ZW50KCB7IHR5cGU6IFwicmVhZHlcIiwgbW9kZWw6IG1vZGVsc1sgdHlwZS5tb2RlbCBdIH0gKTtcblxuXHRcdFx0XHR9IClcblx0XHRcdFx0LmNhdGNoKCBlcnIgPT4gY29uc29sZS5lcnJvciggZXJyICkgKTtcblxuXHRcdH1cblxuXHRcdHRoaXNbIHR5cGUubmFtZSBdID0gY2xhc3MgZXh0ZW5kcyBEb29kYWQge1xuXG5cdFx0XHRjb25zdHJ1Y3RvciggcHJvcHMgKSB7XG5cblx0XHRcdFx0c3VwZXIoIE9iamVjdC5hc3NpZ24oIHsgYXBwIH0sIHR5cGUsIHByb3BzICkgKTtcblxuXHRcdFx0XHRhcHAuZG9vZGFkcy5hZGQoIHRoaXMgKTtcblxuXHRcdFx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoIFwibWVzaExvYWRlZFwiLCAoKSA9PiBhcHAuc2NlbmUuYWRkKCB0aGlzLm1lc2ggKSApO1xuXHRcdFx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoIFwibWVzaFVubG9hZGVkXCIsICgpID0+IGFwcC5zY2VuZS5yZW1vdmUoIHRoaXMubWVzaCApICk7XG5cblx0XHRcdFx0dGhpcy5hZGRFdmVudExpc3RlbmVyKCBcImRpcnR5XCIsICgpID0+ICggYXBwLnVwZGF0ZXMuYWRkKCB0aGlzICksIGFwcC5yZW5kZXJzLmFkZCggdGhpcyApICkgKTtcblx0XHRcdFx0dGhpcy5hZGRFdmVudExpc3RlbmVyKCBcImNsZWFuXCIsICgpID0+ICggYXBwLnVwZGF0ZXMucmVtb3ZlKCB0aGlzICksIGFwcC5yZW5kZXJzLnJlbW92ZSggdGhpcyApICkgKTtcblxuXHRcdFx0fVxuXG5cdFx0XHRzdGF0aWMgZ2V0IG5hbWUoKSB7XG5cblx0XHRcdFx0cmV0dXJuIHR5cGUubmFtZTtcblxuXHRcdFx0fVxuXG5cdFx0fTtcblxuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggdGhpc1sgdHlwZS5uYW1lIF0uY29uc3RydWN0b3IsIFwibmFtZVwiLCB7IHZhbHVlOiB0eXBlLm5hbWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9ICk7XG5cblx0fVxuXG5cdHNldFRpbWVvdXQoIGNhbGxiYWNrLCB0aW1lID0gMCwgYWJzb2x1dGUgPSBmYWxzZSApIHtcblxuXHRcdGNvbnN0IHN1YmV2ZW50ID0geyB0aW1lOiBhYnNvbHV0ZSA/IHRpbWUgOiB0aGlzLnRpbWUgKyB0aW1lLCBjYWxsYmFjaywgY2xlYXI6ICgpID0+IHtcblxuXHRcdFx0Y29uc3QgaW5kZXggPSB0aGlzLnN1YmV2ZW50cy5pbmRleE9mKCBzdWJldmVudCApO1xuXHRcdFx0aWYgKCBpbmRleCA+PSAwICkgdGhpcy5zdWJldmVudHMuc3BsaWNlKCBpbmRleCwgMSApO1xuXG5cdFx0fSB9O1xuXG5cdFx0dGhpcy5zdWJldmVudHMucHVzaCggc3ViZXZlbnQgKTtcblxuXHRcdHJldHVybiBzdWJldmVudDtcblxuXHR9XG5cblx0c2V0SW50ZXJ2YWwoIGNhbGxiYWNrLCB0aW1lID0gMSApIHtcblxuXHRcdGNvbnN0IHdyYXBwZWRDYWxsYmFjayA9IHRpbWUgPT4ge1xuXG5cdFx0XHRjYWxsYmFjayggdGltZSApO1xuXHRcdFx0c3ViZXZlbnQudGltZSA9IHRoaXMudGltZSArIHRpbWU7XG5cdFx0XHR0aGlzLnN1YmV2ZW50cy5wdXNoKCBzdWJldmVudCApO1xuXG5cdFx0fTtcblxuXHRcdGNvbnN0IHN1YmV2ZW50ID0geyB0aW1lOiB0aGlzLnRpbWUgKyB0aW1lLCBjYWxsYmFjazogd3JhcHBlZENhbGxiYWNrLCBjbGVhcjogKCkgPT4ge1xuXG5cdFx0XHRjb25zdCBpbmRleCA9IHRoaXMuc3ViZXZlbnRzLmluZGV4T2YoIHN1YmV2ZW50ICk7XG5cdFx0XHRpZiAoIGluZGV4ID49IDAgKSB0aGlzLnN1YmV2ZW50cy5zcGxpY2UoIGluZGV4LCAxICk7XG5cblx0XHR9IH07XG5cblx0XHR0aGlzLnN1YmV2ZW50cy5wdXNoKCBzdWJldmVudCApO1xuXG5cdFx0cmV0dXJuIHN1YmV2ZW50O1xuXG5cdH1cblxuXHRyZW5kZXIoKSB7XG5cblx0XHR3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCAoKSA9PiB0aGlzLnJlbmRlcigpICk7XG5cblx0XHRjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuXHRcdGNvbnN0IGRlbHRhID0gbm93IC0gdGhpcy5sYXN0UmVuZGVyO1xuXG5cdFx0dGhpcy5sYXN0UmVuZGVyID0gbm93O1xuXHRcdHRoaXMucmVuZGVyVGltZSArPSBkZWx0YTtcblxuXHRcdGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMucmVuZGVycy5sZW5ndGg7IGkgKysgKVxuXHRcdFx0aWYgKCB0eXBlb2YgdGhpcy5yZW5kZXJzWyBpIF0gPT09IFwiZnVuY3Rpb25cIiApIHRoaXMucmVuZGVyc1sgaSBdKCB0aGlzLnJlbmRlclRpbWUgKTtcblx0XHRcdGVsc2UgaWYgKCB0eXBlb2YgdGhpcy5yZW5kZXJzWyBpIF0gPT09IFwib2JqZWN0XCIgKSB7XG5cblx0XHRcdFx0aWYgKCB0aGlzLnJlbmRlcnNbIGkgXS5yZW5kZXIgKSB0aGlzLnJlbmRlcnNbIGkgXS5yZW5kZXIoIHRoaXMucmVuZGVyVGltZSApO1xuXHRcdFx0XHRlbHNlIGlmICggdGhpcy5yZW5kZXJzWyBpIF0ucmVuZGVycyApXG5cdFx0XHRcdFx0Zm9yICggbGV0IG4gPSAwOyBuIDwgdGhpcy5yZW5kZXJzWyBpIF0ucmVuZGVycy5sZW5ndGg7IG4gKysgKVxuXHRcdFx0XHRcdFx0dGhpcy51b2RhdGVzWyBpIF0ucmVuZGVyc1sgbiBdKCB0aGlzLnJlbmRlclRpbWUgKTtcblxuXHRcdFx0fVxuXG5cdFx0dGhpcy5yZW5kZXJlci5yZW5kZXIoIHRoaXMuc2NlbmUsIHRoaXMuY2FtZXJhICk7XG5cblx0fVxuXG5cdHVwZGF0ZSgpIHtcblxuXHRcdGlmICggZW52LmlzU2VydmVyICkge1xuXG5cdFx0XHRjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuXHRcdFx0Y29uc3QgZGVsdGEgPSBub3cgLSB0aGlzLmxhc3ROb3c7XG5cblx0XHRcdHRoaXMubGFzdE5vdyA9IG5vdztcblx0XHRcdHRoaXMudGltZSArPSBkZWx0YTtcblxuXHRcdH0gZWxzZSBpZiAoIGVudi5pc0Jyb3dzZXIgKSB0aGlzLnJlbmRlclRpbWUgPSB0aGlzLnRpbWU7XG5cblx0XHRmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLnVwZGF0ZXMubGVuZ3RoOyBpICsrIClcblx0XHRcdGlmICggdHlwZW9mIHRoaXMudXBkYXRlc1sgaSBdID09PSBcImZ1bmN0aW9uXCIgKSB0aGlzLnVwZGF0ZXNbIGkgXSggdGhpcy50aW1lICk7XG5cdFx0XHRlbHNlIGlmICggdHlwZW9mIHRoaXMudXBkYXRlc1sgaSBdID09PSBcIm9iamVjdFwiICkge1xuXG5cdFx0XHRcdGlmICggdGhpcy51cGRhdGVzWyBpIF0udXBkYXRlICkgdGhpcy51cGRhdGVzWyBpIF0udXBkYXRlKCB0aGlzLnRpbWUgKTtcblx0XHRcdFx0ZWxzZSBpZiAoIHRoaXMudXBkYXRlc1sgaSBdLnVwZGF0ZXMgKVxuXHRcdFx0XHRcdGZvciAoIGxldCBuID0gMDsgbiA8IHRoaXMudXBkYXRlc1sgaSBdLnVwZGF0ZXMubGVuZ3RoOyBuICsrIClcblx0XHRcdFx0XHRcdHRoaXMudW9kYXRlc1sgaSBdLnVwZGF0ZXNbIG4gXSggdGhpcy50aW1lICk7XG5cblx0XHRcdH1cblxuXHRcdGlmICggdGhpcy5zdWJldmVudHMubGVuZ3RoICkge1xuXG5cdFx0XHRjb25zdCBvbGRUaW1lID0gdGhpcy50aW1lO1xuXG5cdFx0XHR0aGlzLnN1YmV2ZW50cy5zb3J0KCAoIGEsIGIgKSA9PiBhLnRpbWUgLSBiLnRpbWUgKTtcblxuXHRcdFx0Ly8gVXNlIGEgY2xvbmUgdG8gcHJldmVudCBpbmZpbml0ZSBsb29wc1xuXHRcdFx0Y29uc3Qgc3ViZXZlbnRzID0gdGhpcy5zdWJldmVudHMuc2xpY2UoIDAgKTtcblxuXHRcdFx0bGV0IGluZGV4ID0gMDtcblx0XHRcdHdoaWxlICggdHJ1ZSApIHtcblxuXHRcdFx0XHRpZiAoIGluZGV4ID09PSBzdWJldmVudHMubGVuZ3RoICkge1xuXG5cdFx0XHRcdFx0aWYgKCBpbmRleCA9PT0gdGhpcy5zdWJldmVudHMubGVuZ3RoICkgdGhpcy5zdWJldmVudHMgPSBbXTtcblx0XHRcdFx0XHRlbHNlIHRoaXMuc3ViZXZlbnRzLnNwbGljZSggMCwgaW5kZXggKTtcblx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHR9IGVsc2UgaWYgKCBzdWJldmVudHNbIGluZGV4IF0udGltZSA+IHRoaXMub2ZmaWNpYWxUaW1lICkge1xuXG5cdFx0XHRcdFx0dGhpcy5zdWJldmVudHMuc3BsaWNlKCAwLCBpbmRleCApO1xuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLnRpbWUgPSBzdWJldmVudHNbIGluZGV4IF0udGltZTtcblxuXHRcdFx0XHRpZiAoIHN1YmV2ZW50c1sgaW5kZXggXS5jYWxsYmFjayApIHN1YmV2ZW50c1sgaW5kZXggXS5jYWxsYmFjayggc3ViZXZlbnRzWyBpbmRleCBdLnRpbWUgKTtcblx0XHRcdFx0ZWxzZSBpZiAoIHN1YmV2ZW50c1sgaW5kZXggXS50YXJnZXQgKSBzdWJldmVudHNbIGluZGV4IF0udGFyZ2V0LmRpc3BhdGNoRXZlbnQoIHN1YmV2ZW50c1sgaW5kZXggXSApO1xuXHRcdFx0XHRlbHNlIHRoaXMuZGlzcGF0Y2hFdmVudCggc3ViZXZlbnRzWyBpbmRleCBdICk7XG5cblx0XHRcdFx0aW5kZXggKys7XG5cblx0XHRcdH1cblxuXHRcdFx0dGhpcy50aW1lID0gb2xkVGltZTtcblxuXHRcdH1cblxuXHRcdGlmICggZW52LmlzU2VydmVyICkgdGhpcy5uZXR3b3JrLnNlbmQoIHRoaXMudGltZSApO1xuXHRcdHNldFRpbWVvdXQoICgpID0+IHRoaXMudXBkYXRlKCksIDI1ICk7XG5cblx0fVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IEFwcDtcbiJdLCJuYW1lcyI6WyJlbnYuaXNDbGllbnQiLCJSYW5kb20iLCJlbnYuaXNTZXJ2ZXIiLCJ3cyIsIlNlcnZlciIsInN0cmluZ2lmeSIsInJ0cy5ldmVudFN5c3RlbSIsImVudi5pc0Jyb3dzZXIiLCJydHMucmVuZGVyZXIiLCJydHMuU2VydmVyTmV0d29yayIsInJ0cy5DbGllbnROZXR3b3JrIiwiZmV0Y2hGaWxlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Q0FDQSxNQUFNLFVBQVUsU0FBUyxLQUFLLENBQUM7O0FBRS9CLENBQUEsQ0FBQyxXQUFXLEVBQUUsR0FBRyxJQUFJLEdBQUc7O0FBRXhCLENBQUEsRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQzs7QUFFbkIsQ0FBQSxFQUFFLElB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RTtBQUNuQyxDQUFBLEVBQUUsR0FBRyxFQUFFLE1BQU07O0FBRWIsQ0FBQSxHQUFHLEtBQUssUUFBUSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEdBQUcsT0FBTyxTQUFTLENBQUM7QUFDakQsQ0FBQSxHQUFHLEtBQUssS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEdBQUcsT0FBTyxTQUFTLENBQUM7O0FBRTlDLENBQUEsR0FBRyxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQzs7QUFFaEMsQ0FBQSxHQUFHLFFBQVEsS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsR0FBRyxDQUFDLElBQUk7QUFDakQsQ0FBQSxJQUFJLEtBQUssR0FBRyxDQUFDOztBQUViLENBQUEsR0FBRyxLQUFLLEVBQUUsYUFBYSxJQUFJLE9BQU8sTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLLFVBQVU7QUFDaEUsQ0FBQSxJQUFJLFNBQVMsR0FBRyxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQzVDLENBQUE7QUFDQSxDQUFBLElBQUksU0FBUyxHQUFHLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQzs7QUFFaEMsQ0FBQSxHQUFHLE9BQU8sU0FBUyxDQUFDOztBQUVwQixDQUFBLEdBQUc7QUFDSCxDQUFBLEVBQUUsR0FBRyxFQUFFLEtBQUssSUFBSTs7QUFFaEIsQ0FBQSxHQUFHLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7O0FBRTVCLENBQUEsR0FBRyxRQUFRLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxFQUFFLEtBQUssR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsSUFBSTtBQUNyRCxDQUFBLElBQUksS0FBSyxHQUFHLENBQUM7O0FBRWIsQ0FBQSxHQUFHLEtBQUssS0FBSyxLQUFLLEtBQUssQ0FBQyxNQUFNLElBQUksS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEdBQUc7O0FBRWhFLENBQUEsSUFBSSxLQUFLLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxLQUFLLEdBQUcsT0FBTzs7QUFFNUMsQ0FBQSxJQUFJLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxLQUFLLENBQUM7QUFDNUIsQ0FBQSxJQUFJLFFBQVEsR0FBRyxTQUFTLENBQUM7O0FBRXpCLENBQUEsSUFBSTs7QUFFSixDQUFBLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUN0QyxDQUFBLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDOztBQUVwQyxDQUFBLEdBQUc7QUFDSCxDQUFBLEVBQUUsRUFBRSxDQUFDOztBQUVMLENBQUEsQ0FBQyxBQUVELEFBbURBLEFBQ0EsQUFBNEI7O0FDeEc1QixjQUFlLEVBQUUsQ0FBQzs7Q0NBbEI7QUFDQSxBQVdBLEFBV0EsQ0FBQSxTQUFTLGNBQWMsRUFBRSxLQUFLLEVBQUUsT0FBTyxHQUFHOztBQUUxQyxDQUFBLENBQUMsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDOztBQUVwQixDQUFBO0FBQ0EsQ0FBQSxDQUFDLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUc7O0FBRWhFLENBQUE7QUFDQSxDQUFBLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLE9BQU8sQ0FBQyxNQUFNLEdBQUcsT0FBTyxFQUFFLENBQUMsRUFBRSxHQUFHLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQzs7QUFFL0QsQ0FBQTtBQUNBLENBQUEsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDbkcsQ0FBQSxHQUFHLE9BQU8sS0FBSyxDQUFDOztBQUVoQixDQUFBO0FBQ0EsQ0FBQSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUM7O0FBRXRDLENBQUE7QUFDQSxDQUFBLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDOztBQUV0QixDQUFBO0FBQ0EsQ0FBQSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLE1BQU0sR0FBRyxFQUFFLE1BQU0sQ0FBQzs7QUFFM0MsQ0FBQSxTQUFTOztBQUVULENBQUE7QUFDQSxDQUFBLEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7O0FBRTdGLENBQUE7QUFDQSxDQUFBLEtBQUssS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksR0FBRyxPQUFPLEtBQUssQ0FBQzs7QUFFbEQsQ0FBQTtBQUNBLENBQUEsVUFBVSxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sR0FBRyxFQUFFLE1BQU0sQ0FBQzs7QUFFdkQsQ0FBQSxLQUFLOztBQUVMLENBQUEsUUFB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QUFJLEVBQUUsR0FBRyxFQUFFLENBQUM7QUFDckIsQ0FBQSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDOztBQUVyQixDQUFBLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUM7QUFDdkIsQ0FBQSxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7O0FBRTdCLENBQUEsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQztBQUN2QixDQUFBLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQzs7QUFFN0IsQ0FBQSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDO0FBQ3ZCLENBQUEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDOztBQUU3QixDQUFBLENBQUM7O0FBRUQsQ0FBQSxTQUFTLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHOztBQUV0QixDQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ1gsQ0FBQSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNiLENBQUEsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDYixDQUFBLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDOztBQUViLENBQUEsQ0FBQyxPQUFPLENBQUMsQ0FBQzs7QUFFVixDQUFBLENBQUM7O0FBRUQsQ0FBQSxTQUFTLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxHQUFHOztBQUU1QixDQUFBLENBQUMsTUFBTSxFQUFFLEdBQUcsSUFBSSxJQUFJLEVBQUUsSUFBSSxFQUFFO0FBQzVCLENBQUEsRUFBRSxLQUFLLEdBQUcsSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLO0FBQzVCLENBQUEsRUFBRSxJQUFJLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQzs7QUFFakIsQ0FBQSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxXQUFXLEtBQUssQ0FBQyxDQUFDO0FBQ3BELENBQUEsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxRQUFRLEdBQUcsQ0FBQyxLQUFLLHNCQUFzQixDQUFDO0FBQ2pGLENBQUEsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQzs7QUFFbkIsQ0FBQSxDQUFDLEtBQUssS0FBSyxHQUFHOztBQUVkLENBQUEsRUFBRSxLQUFLLE9BQU8sS0FBSyxLQUFLLFFBQVEsR0FBRyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDOztBQUVyRCxDQUFBLEVBQUUsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7O0FBRXBDLENBQUEsRUFBRTs7QUFFRixDQUFBLENBQUMsT0FBTyxJQUFJLENBQUM7O0FBRWIsQ0FBQSxDQUFDOztBQUVELENBQUEsU0FBUyxJQUFJLEdBQUc7O0FBRWhCLENBQUEsQ0FBQyxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUM7O0FBRXBCLENBQUEsQ0FBQyxNQUFNLElBQUksR0FBRyxFQUFFLElBQUksTUFBTTs7QUFFMUIsQ0FBQSxFQUFFLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDekIsQ0FBQSxFQUFFLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHOztBQUUzQyxDQUFBLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLENBQUM7QUFDN0IsQ0FBQSxHQUFHLElBQUksQ0FBQyxHQUFHLG1CQUFtQixHQUFHLENBQUMsQ0FBQztBQUNuQyxDQUFBLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDZixDQUFBLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNWLENBQUEsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ1YsQ0FBQSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2YsQ0FBQSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDVixDQUFBLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxXQUFXLENBQUM7O0FBRXhCLENBQUEsR0FBRzs7QUFFSCxDQUFBLEVBQUUsT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssc0JBQXNCLENBQUM7O0FBRTlDLENBQUEsRUFBRSxDQUFDOztBQUVILENBQUEsQ0FBQyxPQUFPLElBQUksQ0FBQzs7QUFFYixDQUFBLENBQUMsQUFFRCxBQUFvQjs7QUNwSHBCLE9BQU0sa0JBQWtCLEdBQUcsRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsQ0FBQzs7QUFFNUUsQ0FBQTtBQUNBLENBQUEsU0FBUyxpQkFBaUIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHOztBQUVyQyxDQUFBLENBQUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztBQUNwRixDQUFBLENBQUMsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDOztBQUV0QyxDQUFBLENBQUMsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDO0FBQzFDLENBQUEsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLElBQUlDLElBQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQzs7QUFFakMsQ0FBQSxDQUFDLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUc7QUFDOUMsQ0FBQSxFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFO0FBQ3pCLENBQUEsR0FBRyxJQUFJLEVBQUUsWUFBWTtBQUNyQixDQUFBLEdBQUcsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJO0FBQ2pCLENBQUEsR0FBRyxJQUFJO0FBQ1AsQ0FBQSxHQUFHLE1BQU0sRUFBRSxXQUFXLEVBQUUsRUFBRSxDQUFDOztBQUUzQixDQUFBLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLENBQUM7QUFDM0IsQ0FBQSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUM7O0FBRXZELENBQUE7QUFDQSxDQUFBLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRTtBQUNkLENBQUEsRUFBRSxJQUFJLEVBQUUsT0FBTztBQUNmLENBQUEsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUk7QUFDaEIsQ0FBQSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSztBQUNsQixDQUFBLEVBQUUsSUFBSTtBQUNOLENBQUEsRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUN4QixDQUFBLEVBQUUsRUFBRSxTQUFTLEVBQUUsQ0FBQzs7QUFFaEIsQ0FBQSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUM7O0FBRXJELENBQUEsQ0FBQzs7QUFFRCxDQUFBO0FBQ0EsQ0FBQSxTQUFTLGtCQUFrQixFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUc7O0FBRXRDLENBQUEsQ0FBQyxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQzs7QUFFdEQsQ0FBQSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDO0FBQ3JELENBQUEsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDOztBQUV0RCxDQUFBLENBQUM7O0FBRUQsQ0FBQTtBQUNBLENBQUE7QUFDQSxDQUFBLFNBQVMsb0JBQW9CLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRzs7QUFFeEMsQ0FBQSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLE9BQU87O0FBRTFCLENBQUE7QUFDQSxDQUFBLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxHQUFHLE9BQU87O0FBRXhGLENBQUE7QUFDQSxDQUFBLENBQUMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ3hCLENBQUEsQ0FBQyxNQUFNLEtBQUssR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQztBQUNqQyxDQUFBLENBQUMsR0FBRyxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDbkIsQ0FBQSxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDOztBQUVuQixDQUFBO0FBQ0EsQ0FBQSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDO0FBQzFELENBQUEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDOztBQUUzQixDQUFBLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQy9CLENBQUEsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQzs7QUFFaEMsQ0FBQSxDQUFDOztBQUVELENBQUE7QUFDQSxDQUFBLFNBQVMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRzs7QUFFckMsQ0FBQTtBQUNBLENBQUEsQ0FBQyxLQUFLQyxRQUFZLEdBQUcsT0FBTzs7QUFFNUIsQ0FBQSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsTUFBTSxHQUFHLElBQUlELElBQU0sRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7O0FBRWpELENBQUEsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxHQUFHLE9BQU87O0FBRXJELENBQUEsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQzs7QUFFekUsQ0FBQSxDQUFDOztBQUVELENBQUE7QUFDQSxDQUFBLFNBQVMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRzs7QUFFdEMsQ0FBQSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7O0FBRTlCLENBQUEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7O0FBRWhDLENBQUEsQ0FBQzs7QUFFRCxDQUFBLFNBQVMsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUc7O0FBRXpCLENBQUEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQzFDLENBQUEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLE1BQU0sR0FBRyxJQUFJQSxJQUFNLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDOztBQUVqRCxDQUFBLENBQUMsTUFBTSxNQUFNLElBQUksSUFBSSxDQUFDLENBQUMsS0FBSztBQUM1QixDQUFBLEVBQUUsS0FBSyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssUUFBUTtBQUMxQyxDQUFBLEdBQUcsR0FBRyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDOztBQUV2QyxDQUFBLENBQUM7O0FBRUQsQUFBeUk7Ozs7Ozs7Ozs7Ozs7Q0MxR3pJOztBQUVBLENBQUEsTUFBTSxhQUFhLFNBQVMsZUFBZSxDQUFDOztBQUU1QyxDQUFBLENBQUMsV0FBVyxFQUFFLEtBQUssR0FBRyxFQUFFLEdBQUc7O0FBRTNCLENBQUEsRUFBRSxLQUFLLEVBQUUsQ0FBQzs7QUFFVixDQUFBLEVBQUUsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQztBQUN6QyxDQUFBLEVBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxJQUFJLFdBQVcsQ0FBQztBQUN4QyxDQUFBLEVBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQztBQUNqQyxDQUFBLEVBQUUsSUFBSSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDO0FBQ3ZCLENBQUEsRUFBRSxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7O0FBRS9CLENBQUEsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7O0FBRWpCLENBQUEsRUFBRTs7QUFFRixDQUFBLENBQUMsT0FBTyxHQUFHOztBQUVYLENBQUEsRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksU0FBUyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDOztBQUVoRixDQUFBLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLEVBQUUsQ0FBQyxJQUFJOztBQUVoRCxDQUFBOztBQUVBLENBQUEsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQzs7QUFFMUMsQ0FBQSxHQUFHLEtBQUssT0FBTyxDQUFDLEtBQUssUUFBUSxHQUFHOztBQUVoQyxDQUFBLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0FBQ3RCLENBQUEsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUM7QUFDOUIsQ0FBQSxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDdEIsQ0FBQSxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUM7O0FBRTlELENBQUEsSUFBSSxNQUFNLEtBQUssQ0FBQyxZQUFZLEtBQUssR0FBRzs7QUFFcEMsQ0FBQSxJQUFJLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHOztBQUUxQyxDQUFBLEtBQUssS0FBSyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUc7O0FBRXBDLENBQUEsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO0FBQ2xDLENBQUEsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO0FBQzFDLENBQUEsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDOztBQUV4QixDQUFBLE1BQU07O0FBRU4sQ0FBQSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQzs7QUFFNUMsQ0FBQSxLQUFLOztBQUVMLENBQUEsSUFBSSxNQUFNOztBQUVWLENBQUEsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksR0FBRzs7QUFFOUIsQ0FBQSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDNUIsQ0FBQSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDcEMsQ0FBQSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7O0FBRXZCLENBQUEsS0FBSzs7QUFFTCxDQUFBLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDOztBQUV0QyxDQUFBLElBQUk7O0FBRUosQ0FBQSxHQUFHLEVBQUUsQ0FBQzs7QUFFTixDQUFBLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLEVBQUUsTUFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUM7QUFDN0UsQ0FBQSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxFQUFFLE1BQU0sSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUM7O0FBRWhFLENBQUEsRUFBRTs7QUFFRixDQUFBLENBQUMsT0FBTyxHQUFHOztBQUVYLENBQUEsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxDQUFDOztBQUVoQyxDQUFBLEVBQUUsS0FBSyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQzs7QUFFM0MsQ0FBQSxFQUFFOztBQUVGLENBQUEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxHQUFHOztBQUVkLENBQUEsRUFBRSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUUvQyxDQUFBLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUM7O0FBRTNCLENBQUEsRUFBRTs7QUFFRixDQUFBLENBQUMsQUFFRCxBQUE2Qjs7Q0MzRjdCOztBQUVBLE9BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO0FBQzNDLE9BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLE1BQU0sQ0FBQyxJQUFJLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEtBQUssZ0JBQWdCLEVBQUUsQ0FBQztBQUNsRixPQUFNLE1BQU0sR0FBRyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQztBQUMvRyxPQUFNLE9BQU8sR0FBRyxDQUFDLElBQUksTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLEdBQUcsT0FBTyxHQUFHLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUM7QUFDdkcsT0FBTSxLQUFLLEdBQUcsaUNBQWlDLENBQUM7QUFDaEQsT0FBTSxlQUFlLEdBQUcsRUFBRSxJQUFJLEVBQUUsS0FBSyxNQUFNLEtBQUssQ0FBQzs7QUFFakQsQ0FBQSxTQUFTLFNBQVMsRUFBRSxLQUFLLEVBQUUsUUFBUSxHQUFHLGVBQWUsRUFBRSxNQUFNLEdBQUcsUUFBUSxHQUFHOztBQUUzRSxDQUFBLENBQUMsS0FBSyxLQUFLLElBQUksSUFBSSxHQUFHLE9BQU8sTUFBTSxDQUFDO0FBQ3BDLENBQUEsQ0FBQyxLQUFLLE9BQU8sS0FBSyxLQUFLLFFBQVEsR0FBRyxPQUFPLFFBQVEsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQUUsR0FBRyxNQUFNLEVBQUUsQ0FBQztBQUM5RyxDQUFBLENBQUMsS0FBSyxPQUFPLEtBQUssS0FBSyxTQUFTLEdBQUcsT0FBTyxRQUFRLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO0FBQ2xGLENBQUEsQ0FBQyxLQUFLLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxPQUFPLEtBQUssS0FBSyxVQUFVLEdBQUc7O0FBRWpFLENBQUEsRUFBRSxLQUFLLE9BQU8sS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLFVBQVUsR0FBRyxPQUFPLFNBQVMsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLE1B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QUFDLFdBQVcsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxHQUFHLEVBQUUsR0FBRzs7QUFFM0MsQ0FBQSxFQUFFLEtBQUssRUFBRSxDQUFDOztBQUVWLENBQUEsRUFBRSxJQUFJLENBQUMsRUFBRSxHQUFHLE1BQU0sR0FBRyxDQUFDOztBQUV0QixDQUFBO0FBQ0EsQ0FBQSxFQUFFLEtBQUssT0FBTyxFQUFFLEtBQUssUUFBUSxHQUFHOztBQUVoQyxDQUFBLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztBQUNsQyxDQUFBLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztBQUNsQyxDQUFBLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztBQUNsQyxDQUFBLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzs7QUFFbEMsQ0FBQTs7QUFFQSxDQUFBLEdBQUcsTUFBTSxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssU0FBUyxHQUFHOztBQUVuQyxDQUFBLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ3RDLENBQUEsR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDdEMsQ0FBQSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFD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TSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sSUFBSTs7QUFFaEUsQ0FBQSxHQUFHLEtBQUssSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsR0FBRzs7QUFFaEQsQ0FBQSxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7QUFDOUIsQ0FBQSxJQUFJLENBQUMsR0FBRyxDQUFDOztBQUVULENBQUEsSUFBSSxNQUFNLEtBQUssSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsR0FBRzs7QUFFdkQsQ0FBQSxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7QUFDOUIsQ0FBQSxJQUFJLENBQUMsR0FBRyxDQUFDOztBQUVULENBQUEsSUFBSSxNQUFNOztBQUVWLENBQUEsSUFBSSxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO0FBQzdCLENBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDOztBQUVmLENBQUEsSUFBSTs7QUFFSixDQUFBLEdBQUcsS0FBSyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEtBQUssU0FBUyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7QUFDeEYsQ0FBQSxHQUFHLEtBQUssSUFBSSxFQUFFLENBQUMsRUFBRSxLQUFLLFNBQVMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FB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RUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7O0FBRTlDLENBQUEsR0FBRyxNQUFNLEtBQUssT0FBTyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsS0FBSyxVQUFVLEdBQUc7O0FBRXhELENBQUEsR0FBRyxLQUFLLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLEdBQUcsT0FBTyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ2hGLENBQUEsR0FBRyxPQUFPLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7O0FBRTlDLENBQUEsR0FBRzs7QUFFSCxDQUFBLEVBQUUsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFO0FBQzNHLENBQUEsR0FBRyxNQUFNLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7O0FBRXZHLENBQUEsRUFBRSxPQUFPLE1BQU0sR0FBRyxNQUFNO0FBQ3hCLENBQUEsR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUU7QUFDL0UsQ0FBQSxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDOztBQUVoRixDQUFBLEVBQUU7O0FBRUYsQ0FBQSxDQUFDLE1BQU0sR0FBRzs7QUFFVixDQUFBLEVBQUUsT0FBTztBQUNULENBQUEsR0FBRyxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUc7QUFDakIsQ0FBQSxHQUFHLFdBQVcsRUFBRSxPQUFPO0FBQ3ZCLENBQUEsR0FBRyxDQUFDOztBQUVKLENBQUEsRUFBRTs7QUFFRixDQUFBLENBQUMsTUFBTSxHQUFHOztBQUVWLENBQUEsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxPQUFPOztBQUU1QixDQUFBLEVBQUUsSUFBSSxLQUFLLENBQUM7O0FBRVosQ0FBQSxFQUFFLEtBQUssSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyw2QkFBNkIsRUFBRSxJQUFJLEVBQUUsQ0FBQztBQUNqRixDQUFBLE9BQU8sS0FBSyxJQUFJLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyw2QkFBNkIsRUFBRSxJQUFJLEVBQUUsQ0FBQztBQUMxRyxDQUFBLE9BQU8sS0FBSyxJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDO0FBQ3RHLENBQUEsT0FBTyxPQUFPLE9BQU8sQ0FBQyxLQUFLLEVBQUUscUJBQXFCLEVBQUUsQ0FBQzs7QUFFckQsQ0FBQSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDOztBQUV4QyxDQUFBLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDOztBQUVsRSxDQUFBOztBQUVBLENBQUEsRUFBRSxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQzs7QUFFckIsQ0FBQSxFQUFFLEtBQUssTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLEdBQUcsT0FBTzs7QUFFM0QsQ0FBQTtBQUNBLENBQUE7O0FBRUEsQ0FBQSxFQUFFLE1BQU0sU0FBUyxHQUFHLEVBQUUsQ0FBQzs7QUFFdkIsQ0FBQSxFQUFFLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRztBQUMxQyxDQUFBLEdBQUcsU0FBUyxDQUFDLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQzs7QUFFdEgsQ0FBQSxFQUFFLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRztBQUMxQyxDQUFBLEdBQUcsU0FBUyxDQUFDLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQzs7QUFFdEgsQ0FBQSxFQUFFLEtBQUssSUFBSSxDQUFDLEdBQUcsR0FBRyxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxHQUFHLFNBQVMsRUFBRSxDQUFDOztBQUVqRSxDQUFBLEVBQUUsU0FBUyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7O0FBRWhELENBQUEsRUFBRSxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUc7QUFDN0MsQ0FBQSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7O0FBRXhDLENBQUEsRUFBRTs7QUFFRixDQUFBLENBQUMsQUFFRCxBQUFvQjs7QUNuUXBCLE9BQU1FLFdBQVMsR0FBRyxLQUFLLElBQUksS0FBSyxLQUFLLFFBQVEsR0FBRyxZQUFZLEdBQUcsS0FBSyxLQUFLLEVBQUUsUUFBUSxHQUFHLGFBQWEsR0FBRyxLQUFLLENBQUM7QUFDNUcsT0FBTSxLQUFLLEdBQUcsS0FBSyxJQUFJLEtBQUssS0FBSyxZQUFZLEdBQUcsUUFBUSxHQUFHLEtBQUssS0FBSyxhQUFhLEdBQUcsRUFBRSxRQUFRLEdBQUcsS0FBSyxDQUFDOztBQUV4RyxDQUFBLFNBQVMsV0FBVyxFQUFFLEVBQUUsS0FBSyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRzs7QUFFNUYsQ0FBQTs7QUFFQSxDQUFBLENBQUMsS0FBSyxPQUFPLFFBQVEsS0FBSyxRQUFRLEdBQUcsUUFBUSxHQUFHLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQzs7QUFFbEUsQ0FBQSxDQUFDLE1BQU0sSUFBSSxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUM7O0FBRTFCLENBQUEsQ0FBQyxLQUFLLElBQUksS0FBSyxTQUFTLEdBQUc7O0FBRTNCLENBQUEsRUFBRSxLQUFLLFFBQVEsS0FBSyxRQUFRLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQztBQUN4QyxDQUFBLE9BQU8sSUFBSSxHQUFHLElBQUksR0FBRyxRQUFRLENBQUM7O0FBRTlCLENBQUEsRUFBRTs7QUFFRixDQUFBLENBQUMsS0FBSyxRQUFRLEtBQUssU0FBUyxHQUFHLFFBQVEsR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDOztBQUV0RCxDQUFBLENBQUMsTUFBTSxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNOztBQUV2QyxDQUFBLEVBQUUsTUFBTSxLQUFLLEdBQUcsRUFBRSxJQUFJLEdBQUcsU0FBUyxLQUFLLElBQUksQ0FBQzs7QUFFNUMsQ0FBQSxFQUFFLEtBQUssS0FBSyxJQUFJLFFBQVEsR0FBRyxPQUFPLEdBQUcsQ0FBQzs7QUFFdEMsQ0FBQSxFQUFFLE9BQU8sS0FBSyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUM7O0FBRTlCLENBQUEsRUFBRSxDQUFDOztBQUVILENBQUEsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRTtBQUN0QixDQUFBLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxJQUFJO0FBQzdDLENBQUEsRUFBRSxJQUFJLEVBQUUsS0FBSyxJQUFJLEVBQUUsS0FBSyxHQUFHLEtBQUssS0FBSyxJQUFJLEdBQUcsSUFBSSxHQUFHLFNBQVM7QUFDNUQsQ0FBQSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUVBLFdB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TSxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQzs7QUFFN0IsQ0FBQSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQzs7QUFFdEQsQ0FBQTtBQUNBLENBQUEsR0FBRyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQzs7QUFFL0MsQ0FBQSxHQUFHLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNqQixDQUFBLEdBQUcsUUFBUSxJQUFJLEdBQUc7O0FBRWxCLENBQUEsSUFBSSxLQUFLLEtBQUssS0FBSyxTQUFTLENBQUMsTUFBTSxHQUFHOztBQUV0QyxDQUFBLEtBQUssS0FBSyxLQUFLLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFDaEUsQ0FBQSxVQUFVLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQztBQUM1QyxDQUFBLEtBQUssTUFBTTs7QUFFWCxDQUFBLEtBQUssTUFBTSxLQUFLLFNBQVMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFlBQVksR0FBRzs7QUFFOUQsQ0FBQSxLQUFLLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQztBQUN2QyxDQUFBLEtBQUssTUFBTTs7QUFFWCxDQUFBLEtBQUs7O0FBRUwsQ0FBQSxJQUFJLElBQUksQ0FBQyxJQUFJLEdBQUcsU0FBUyxFQUFFLEtBQUssRUFBRSxDQUFDLElBQUksQ0FBQzs7QUFFeEMsQ0FBQSxJQUFJLEtBQUssU0FBUyxFQUFFLEtBQUssRUFBRSxDQUFDLFFBQVEsR0FBRyxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUM5RixDQUFBLFNBQVMsS0FBSyxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsTUFBTSxHQUFHLFNBQVMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDO0FBQ3hHLENBQUEsU0FBUyxJQUFJLENBQUMsYUFBYSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDOztBQUVsRCxDQUFBLElBQUksS0FBSyxHQUFHLENBQUM7O0FBRWIsQ0FBQSxJQUFJOztBQUVKLENBQUEsR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQzs7QUFFdkIsQ0FBQSxHQUFHOztBQUVILENBQUEsRUFBRSxLQUFLTCxRQUFZLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3JELENBQUEsRUFBRSxVQUFVLEVBQUUsTUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7O0FBRXhDLENBQUEsRUFBRTs7QUFFRixDQUFBLENBQUMsQUFFRCxBQUFtQjs7Ozs7Ozs7Ozs7OzsifQ==
