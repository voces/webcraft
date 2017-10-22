
import Player from "../../Player.js";
import Random from "../../../lib/seedrandom-alea.js";

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

export default clientJoinHandler;
