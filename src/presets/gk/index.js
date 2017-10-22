
import playerJoinHandler from "./playerJoin.js";
import playerLeaveHandler from "./playerLeave.js";
import stateHandler from "./state.js";
import clientJoinHandler from "./clientJoin.js";
import clientLeaveHandler from "./clientLeave.js";
import clientMessageHandler from "./clientMessage.js";

export default app => {

	app.addEventListener( "playerJoin", e => playerJoinHandler( app, e ) );
	app.addEventListener( "playerLeave", e => playerLeaveHandler( app, e ) );
	app.addEventListener( "state", e => stateHandler( app, e ) );
	app.addEventListener( "clientJoin", e => clientJoinHandler( app, e ) );
	app.addEventListener( "clientLeave", e => clientLeaveHandler( app, e ) );
	app.addEventListener( "clientMessage", e => clientMessageHandler( app, e ) );

};

export { playerJoinHandler, playerLeaveHandler, stateHandler, clientJoinHandler, clientLeaveHandler, clientMessageHandler };
