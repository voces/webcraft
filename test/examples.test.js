
export default () => describe( "examples", () => {

	[ "pong", "tron", "maze" ].forEach( example => {

		it( example, function ( done ) {

			this.timeout( 750 );

			import( `../examples/games/${example}/main.js` ).then( imported => {

				imported.default.network.addEventListener( "ready", () => {

					imported.default.network.ws.close();
					done();

				} );

			} );

		} );

	} );

} );
