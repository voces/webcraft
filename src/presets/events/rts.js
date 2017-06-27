
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

		player.send( { type: "playerJoin", player: {
			id: app.players[ i ].id,
			color: app.players[ i ].color
		} } );

		app.players[ i ].send( {
			type: "playerJoin",
			seed,
			player: {
				id: player.id,
				color: player.color
			} } );

	}

	app.players.add( player );

	app.dispatchEvent( { type: "playerJoin", player } );

}

// Server
function clientLeaveHandler( app, e ) {

	const player = app.players.dict[ "p" + e.client.id ];

	app.network.send( { type: "playerLeave", player } );
	app.dispatchEvent( { type: "playerLeave", player } );

	app.players.remove( player );
	player.color.taken = false;

}

// Server
// This modifies the actual event, replacing client with player
function clientMessageHandler( app, e ) {

	if ( ! e.client ) return;

	// Ignore unsafe messages
	if ( ! e.message.type || reservedEventTypes.indexOf( e.message.type ) !== - 1 ) return;

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

}

// Local
function localPlayerHandler( app, e ) {

	app.time = e.time;
	app.random = new Random( e.seed );

	const player = new Player( Object.assign( { key: "p" + e.player.id }, e.player ) );

	app.players.add( player );

	app.localPlayer = player;

}

export { clientJoinHandler, clientLeaveHandler, clientMessageHandler, playerJoinHandler,
 	localPlayerHandler, reservedEventTypes };
