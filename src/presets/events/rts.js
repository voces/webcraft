
import Player from "../../core/Player.js";
import * as env from "../../misc/env.js";

function clientJoinHandler( app, e ) {

	console.log( "clientJoinHandler" );

	const player = new Player( Object.assign( { key: "p" + e.client.id }, e.client ) );

	player.send( { type: "localPlayer", time: app.time, player: {
		id: player.id,
		color: player.color
	} } );

	for ( let i = 0; i < app.players.length; i ++ ) {

		player.send( { type: "playerJoin", player: {
			id: app.players[ i ].id,
			color: app.players[ i ].color
		} } );

		app.players[ i ].send( { type: "playerJoin", player: {
			id: player.id,
			color: player.color
		} } );

	}

	app.players.add( player );

	app.dispatchEvent( { type: "playerJoin", player, networked: true } );

}

function clientLeaveHandler( app, e ) {

	const player = app.players.dict[ "p" + e.client.id ];

	app.dispatchEvent( { type: "playerLeave", player, networked: true } );

	app.players.remove( player );
	player.color.taken = false;

}

// This modifies the actual event, replacing client with player
function clientMessageHandler( app, e ) {

	if ( ! e.client ) return;

	e.player = app.players.dict[ "p" + e.client.id ];
	delete e.client;

}

function playerJoinHandler( app, e ) {

	if ( env.isServer ) return;
	if ( app.players.dict[ "p" + e.player.id ] ) return;

	const player = new Player( Object.assign( { key: "p" + e.player.id }, e.player ) );

	app.players.add( player );

}

function localPlayerHandler( app, e ) {

	app.time = e.time;

	const player = new Player( Object.assign( { key: "p" + e.player.id }, e.player ) );

	app.players.add( player );

	app.localPlayer = player;

}

export { clientJoinHandler, clientLeaveHandler, clientMessageHandler, playerJoinHandler,
 	localPlayerHandler };
