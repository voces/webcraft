
export default () => describe( "examples", () => {

	[ "pong", "tron", "maze" ].forEach( example => {

		it( example, function ( done ) {

			this.timeout( 2000 );

			const goodHandles = process._getActiveHandles();

			import( `../examples/games/${example}/main.js` ).then( imported => {

				imported.default.network.addEventListener( "ready", () => {

					process._getActiveHandles().filter( handle => ! goodHandles.includes( handle ) ).forEach( handle =>{

						if ( typeof handle.close === "function" ) return handle.close();
						if ( typeof handle.destroy === "function" ) return handle.destroy();

					} );

					done();

				} );

			} );

		} );

	} );

} );
