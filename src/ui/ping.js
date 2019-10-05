
const pings = [];
const elem = document.getElementById( "ping" );

export default message => {

	pings.push( message );
	if ( pings.length === 6 ) pings.shift();

	// display the mode
	const clone = [ ...pings ];
	const mode = clone.sort( ( a, b ) => a.ping - b.ping )[ Math.min( 2, pings.length - 1 ) ];
	elem.textContent = mode.ping + "ms";
	elem.setAttribute(
		"title",
		clone
			.reverse()
			.map( ( { type, ping } ) => `${type}: ${ping}ms` )
			.join( "\n" )
	);

};
