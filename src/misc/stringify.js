
// Adapated from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON#Polyfill

const toString = Object.prototype.toString;
const isArray = Array.isArray || ( a => toString.call( a ) === "[object Array]" );
const escMap = { "\"": "\\\"", "\\": "\\\\", "\b": "\\b", "\f": "\\f", "\n": "\\n", "\r": "\\r", "\t": "\\t" };
const escFunc = m => escMap[ m ] || "\\u" + ( m.charCodeAt( 0 ) + 0x10000 ).toString( 16 ).substr( 1 );
const escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;
const defaultReplacer = ( prop, value ) => value;

function stringify( value, replacer = defaultReplacer, toJSON = "toJSON" ) {

	if ( value == null ) return "null";
	if ( typeof value === "number" ) return replacer( undefined, isFinite( value ) ? value.toString() : "null" );
	if ( typeof value === "boolean" ) return replacer( undefined, value.toString() );
	if ( typeof value === "object" || typeof value === "function" ) {

		if ( typeof value[ toJSON ] === "function" ) return stringify( replacer( undefined, value[ toJSON ]() ), replacer, toJSON );
		if ( typeof value.toJSON === "function" ) return stringify( replacer( undefined, value.toJSON() ), replacer, toJSON );

		if ( typeof value === "function" ) return "\"" + value.toString().replace( escRE, escFunc ) + "\"";

		if ( isArray( value ) ) {

			let res = "[";

			for ( let i = 0; i < value.length; i ++ )
				res += ( i ? ", " : "" ) + stringify( replacer.call( value, i, value[ i ] ), replacer, toJSON );

			return res + "]";

		}

		const tmp = [];

		for ( const prop in value )
			if ( value.hasOwnProperty( prop ) )
				tmp.push( stringify( replacer.call( value, prop, prop ), replacer, toJSON ) + ": " + stringify( replacer.call( value, prop, value[ prop ] ), replacer, toJSON ) );

		return "{" + tmp.join( ", " ) + "}";

	}

	return "\"" + value.toString().replace( escRE, escFunc ) + "\"";

}

export default stringify;