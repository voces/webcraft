
const isBrowser = new Function( "try {return this===window;}catch(e){ return false;}" )();

let fetchFile;

if ( isBrowser ) {

	fetchFile = path => new Promise( ( resolve, reject ) => {

		const request = new XMLHttpRequest();

		request.ontimeout = err => reject( err );

		request.onload = () => {

			if ( request.readyState !== 4 ) return;

			if ( request.status >= 400 ) return reject( request );

			resolve( request.responseText );

		};

		request.open( "GET", path, true );
		request.timeout = 5000;
		request.send();

		return request.responseText;

	} );

} else {

	const fs = require( "fs" );

	fetchFile = path => new Promise( ( resolve, reject ) =>
        fs.readFile( path, "utf8", ( err, res ) => err ? reject( err ) : resolve( res ) ) );

}

export default fetchFile;
