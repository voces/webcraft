
import Player from "../../core/Player.js";
import * as env from "../../misc/env.js";

import Random from "../../../lib/seedrandom-alea.js";

const reservedEventTypes = [ "playerJoin", "playerLeave", "localPlayer", "sync", "init" ];

// Server
function clientJoinHandler( app, e ) {

	const player = new Player( Object.assign( { key: "p" + e.client.id }, e.client ) );

	const seed = app.initialSeed + player.id;
	app.random = new Random( seed );

	player.send( {
		type: "localPlayer",
		time: app.time,
		seed,
		player: {
			id: player.id,
			color: player.color
		} } );

	for ( let i = 0; i < app.players.length; i ++ ) {

		// player.send( {
		// 	type: "playerJoin",
		// 	player: {
		// 		id: app.players[ i ].id,
		// 		color: app.players[ i ].color
		// 	} } );

		app.players[ i ].send( {
			type: "playerJoin",
			time: app.time,
			seed,
			player: {
				id: player.id,
				color: player.color
			} } );

	}

	app.players.add( player );
	app.players.sort( ( a, b ) => a.id > b.id ? 1 : - 1 );

	// console.log( app.state );
	player.send( {
		type: "state",
		time: app.time,
		state: app.state
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
	if ( env.isServer ) return;

	if ( e.seed ) app.random = new Random( e.seed );

	if ( app.players.dict[ "p" + e.player.id ] ) return;

	const player = new Player( Object.assign( { key: "p" + e.player.id }, e.player ) );

	app.players.add( player );
	app.players.sort( ( a, b ) => a.id > b.id ? 1 : - 1 );
	app.handles.add( player );

}

// Server + Local
function playerLeaveHandler( app, e ) {

	e.player.color.taken = false;

	app.players.remove( e.player );
	app.handles.remove( e.player );

}

// Local
function localPlayerHandler( app, e ) {

	app.time = e.time;
	app.random = new Random( e.seed );

	const player = new Player( Object.assign( { key: "p" + e.player.id }, e.player ) );

	app.players.add( player );
	app.players.sort( ( a, b ) => a.id > b.id ? 1 : - 1 );
	app.handles.add( player );

	app.localPlayer = player;

}

export { clientJoinHandler, clientLeaveHandler, clientMessageHandler, playerJoinHandler,
 	localPlayerHandler, reservedEventTypes, playerLeaveHandler };
