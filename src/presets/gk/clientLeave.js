
// Server
function clientLeaveHandler( app, e ) {

	const player = app.players.dict[ "p" + e.client.id ];

	app.network.send( { type: "playerLeave", player } );
	app.dispatchEvent( "playerLeave", { player } );

}

export default clientLeaveHandler;
