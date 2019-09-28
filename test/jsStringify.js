
// This functionality is meant for object literals as a JS-version of JSON.stringify

const stringifyArray = ( arr, space, level, curLength, spaceWidth, { wrapping, replacer, trailingComma } ) => {

	// A minimum; "[ 0 ]".length = 5, "{ 0, 1 }".length = 8, etc
	let tryingCompact = curLength + arr.length * 3 + 2 < wrapping;
	let compact = "[" + ( arr.length ? " " : "" );

	for ( let i = 0; i < arr.length && tryingCompact; i ++ ) {

		compact += replacer( arr[ i ], level + 1, curLength + compact.length ) +
				( i < arr.length - 1 ? ", " : "" );

		if ( compact.length > wrapping ) tryingCompact = false;

	}
	if ( tryingCompact ) {

		compact += ( arr.length ? " " : "" ) + "]";
		if ( compact.length <= wrapping ) return compact;

	}

	return [
		"[",
		arr
			.map( element =>
				space.repeat( level + 1 ) +
						replacer( element, level + 1, ( level + 1 ) * spaceWidth )
			)
			.join( ",\n" ) + ( trailingComma ? "," : "" ),
		space.repeat( level ) + "]",
	].join( "\n" );

};

const escapeKey = key => key.match( /^[_a-zA-Z][_0-9a-zA-Z]*$/ ) ? key : `"${key.replace( /"/g, "\\" )}"`;

const stringifyObject = ( obj, space, level, curLength, spaceWidth, { wrapping, replacer, trailingComma } ) => {

	const entries = Object.entries( obj );
	// A minimum; "{ a: 0 }".length = 8, "{ a: 0, b: 1 }".length = 14, etc
	let tryingCompact = curLength + entries.length * 6 + 2 <= wrapping;
	if ( tryingCompact ) {

		let compact = "{" + ( entries.length ? " " : "" );

		for ( let i = 0; i < entries.length && tryingCompact; i ++ ) {

			const [ key, value ] = entries[ i ];

			compact += escapeKey( key ) + ": " +
					replacer( value, level + 1, curLength + compact.length ) +
					( i < entries.length - 1 ? ", " : "" );

			if ( curLength + compact.length > wrapping ) tryingCompact = false;

		}

		if ( tryingCompact ) {

			compact += ( entries.length ? " " : "" ) + "}";
			if ( curLength + compact.length <= wrapping ) return compact;

		}

	}

	return [
		"{",
		entries
			.map( ( [ key, value ] ) => {

				const prefix = escapeKey( key ) + ": ";
				return space.repeat( level + 1 ) +
					prefix +
					replacer(
						value,
						level + 1,
						( level + 1 ) * spaceWidth + prefix.length
					);

			} )
			.join( ",\n" ) + ( trailingComma ? "," : "" ),
		space.repeat( level ) + "}",
	].join( "\n" );

};

const jsStringify = (
	obj,
	space = "\t",
	options = {}
) => {

	if ( ! ( "wrapping" in options ) ) options.wrapping = 80;
	if ( ! ( "tabWidth" in options ) ) options.tabWidth = 4;
	if ( ! ( "trailingComma" in options ) ) options.trailingComma = true;
	const { tabWidth } = options;

	if ( typeof space === "number" ) space = " ".repeat( space );
	const spaceWidth = space.replace( /\t/g, " ".repeat( tabWidth ) ).length;

	const replacer = options.replacer || ( options.replacer = ( obj, level = 0, curLength = 0 ) => {

		// No chance of these having .toJS
		if ( obj === undefined )
			return "undefined";

		if ( obj === null )
			return "null";

		// Allow values to have their own toJS function
		if ( typeof obj.toJS === "function" )
			return obj.toJS( obj, space, level, curLength, options );

		// Strings are pretty safe, just escape their definer
		if ( typeof obj === "string" )
			return `"${obj.replace( /"/g, "\\\"" ).replace( /\\/g, "\\\\" )}"`;

		if ( typeof obj === "number" )
			if ( obj < 0 ) return `- ${Math.abs( obj )}`;
			else obj.toString();

		// booleans and functions
		if ( typeof obj !== "object" )
			return obj.toString();

		if ( Array.isArray( obj ) )
			return stringifyArray( obj, space, level, curLength, spaceWidth, options );

		return stringifyObject( obj, space, level, curLength, spaceWidth, options );

	} );

	return replacer( obj );

};

export default jsStringify;
