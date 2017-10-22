
const reservedEventTypes = [ "playerJoin", "playerLeave", "sync", "state" ];

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

export default clientMessageHandler;
