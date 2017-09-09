
import Player from "../../core/Player.js";
import Doodad from "../../entities/Doodad.js";
import * as env from "../../misc/env.js";

import Random from "../../../lib/seedrandom-alea.js";

const reservedEventTypes = [ "playerJoin", "playerLeave", "sync", "state" ];

// Server
function clientJoinHandler( app, e ) {

	const player = new Player( Object.assign( { key: "p" + e.client.id }, e.client ) );
	player.addEventListener( "remove", () => app.players.remove( player ) );

	const playerState = player.toState();

	const seed = app.initialSeed + player.id;
	app.random = new Random( seed );

	for ( let i = 0; i < app.players.length; i ++ )
		app.players[ i ].send( {
			type: "playerJoin",
			time: app.time,
			seed,
			player: playerState } );

	app.players.add( player );
	app.players.sort( ( a, b ) => a.id > b.id ? 1 : - 1 );

	player.send( {
		type: "state",
		time: app.time,
		state: app.state,
		seed,
		local: player.toJSON()
	}, "toState" );

	app.dispatchEvent( "playerJoin", { player } );

}

// Server
function clientLeaveHandler( app, e ) {

	const player = app.players.dict[ "p" + e.client.id ];

	app.network.send( { type: "playerLeave", player } );
	app.dispatchEvent( "playerLeave", { player } );

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
	app.dispatchEvent( e.message.type, e.message );

}

// Server + Local
function playerJoinHandler( app, e ) {

	// Don't do anything on the server
	if ( env.isServer ) return;

	if ( e.seed ) app.random = new Random( e.seed );

	if ( app.players.dict[ "p" + e.player.id ] ) return;

	new app.Player( Object.assign( { key: "p" + e.player.id }, e.player ) );

}

// Server + Local
function playerLeaveHandler( app, e ) {

	e.player.status = "left";

}

function state( app, e ) {

	if ( e.local ) app.localPlayer = e.local;
	if ( e.seed ) app.random = new Random( e.seed );

	for ( const prop in e.state )
		if ( typeof e.state[ prop ] !== "object" || e.state[ prop ] === null || ! ( e.state[ prop ] instanceof Doodad ) )
			app.state[ prop ] = e.state[ prop ];

}

export default app => {

	app.addEventListener( "playerJoin", e => playerJoinHandler( app, e ) );
	app.addEventListener( "playerLeave", e => playerLeaveHandler( app, e ) );
	app.addEventListener( "state", e => state( app, e ) );
	app.addEventListener( "clientJoin", e => clientJoinHandler( app, e ) );
	app.addEventListener( "clientLeave", e => clientLeaveHandler( app, e ) );
	app.addEventListener( "clientMessage", e => clientMessageHandler( app, e ) );

};

export { playerJoinHandler, playerLeaveHandler, state, clientJoinHandler, clientLeaveHandler, clientMessageHandler };
