
import game from "../index.js";

const element = document.getElementById( "clock" );

const formatSeconds = time => {

	// Don't render millieconds
	time = Math.floor( time );

	const seconds = Math.max( time % 60, 0 ).toString();
	time = Math.floor( time / 60 );

	const minutes = Math.max( time % 60, 0 ).toString();

	return minutes.padStart( 2, "0" ) + ":" + seconds.padStart( 2, "0" );

};

setTimeout( () => {

	game.addEventListener( "update", time => {

		if ( ! game.round ) return;
		element.textContent = formatSeconds( game.round.expireAt - time );

	} );

} );

