
export const isBrowser = typeof window !== "undefined";

// TODO: Make this entire thing not horrid
let loader = url => {

	const request = { url, relative: load.relative };
	request.p = new Promise( ( resolve, reject ) => {

		request.resolve = resolve;
		request.reject = reject;

	} );

	loaderQueue.push( request );

	return request.p;

};

export const load = ( ...args ) => loader( ...args );
const loaderQueue = [];
( async () => {

	if ( typeof fetch === "undefined" ) {

		const readFile = await import( "fs" ).then( i => i.default.readFile );
		const join = await import( "path" ).then( i => i.default.join );

		loader = path => new Promise( ( resolve, reject ) =>
			readFile( load.relative ? join( load.relative, path ) : path, "utf8", ( err, res ) =>
				err ? reject( err ) : resolve( res ) ) );

	} else loader = url => fetch( url ).then( r => r.text() );

	const rejected = {};
	const relative = load.relative;
	for ( let i = 0; i < loaderQueue.length; i ++ ) {

		load.relative = loaderQueue[ i ].relative;
		loader( loaderQueue[ i ].url )
			.catch( err => ( loaderQueue[ i ].reject( err ), rejected ) )
			.then( res => res !== rejected && loaderQueue[ i ].resolve( res ) );

	}
	load.relative = relative;

} )();

export const commonConstructor = ( object, props, app ) => {

	app = app || ( props && props.app ) || ( object && object.app );

	// app might not be set at construction time (added after), we'll wait :)
	if ( ! app ) {

		Object.defineProperty( object, "app", {
			set: app => {

				Object.defineProperty( object, "app", { value: app } );
				commonConstructor( object, props, app );

			},
			configurable: true
		} );

		return;

	}

	// Stuff that ties into APIs (such as graphics, window event listeners, etc)
	if ( isBrowser ) object.initBrowser ? object.initBrowser( props ) : null;
	else object.initNode ? object.initNode( props ) : null;

	// Stuff that ties into the either the host or client (networked event listeners)
	if ( app.isHost ) object.initHost ? object.initHost( props ) : null;
	else object.initClient ? object.initClient( props ) : null;

};

export const randomInt = ( randomNumber, max, min = 0 ) =>
	Math.round( randomNumber * ( max - min ) + min );

