
// TODO: nuke this entire approach and switch to true ES6 modules once dynamic imports are made available in Chrome
// https://tc39.github.io/proposal-dynamic-import/

import { isBrowser } from "./env.js";

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
