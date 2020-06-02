
// This functionality is meant for object literals as a JS-version of JSON.stringify

const stringifyArray = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	arr: any[],
	space: string,
	level: number,
	curLength: number,
	spaceWidth: number,
	{ wrapping, replacer, trailingComma }: Options,
) => {

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
						replacer( element, level + 1, ( level + 1 ) * spaceWidth ),
			)
			.join( ",\n" ) + ( trailingComma ? "," : "" ),
		space.repeat( level ) + "]",
	].join( "\n" );

};

const escapeKey = ( key: string ) => key.match( /^[_a-zA-Z][_0-9a-zA-Z]*$/ ) ? key : `"${key.replace( /"/g, "\\" )}"`;

const stringifyObject = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	obj: any,
	space: string,
	level: number,
	curLength: number,
	spaceWidth: number,
	{ wrapping, replacer, trailingComma }: Options,
) => {

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
						( level + 1 ) * spaceWidth + prefix.length,
					);

			} )
			.join( ",\n" ) + ( trailingComma ? "," : "" ),
		space.repeat( level ) + "}",
	].join( "\n" );

};

type Options = {
	wrapping: number,
	tabWidth: number,
	trailingComma: boolean,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	replacer: ( obj: any, level?: number, curLength?: number ) => string
}

const optionsWithDefaults = ( { wrapping, tabWidth, trailingComma, replacer }: Partial<Options> ): Options => ( {
	wrapping: wrapping ?? 80,
	tabWidth: tabWidth ?? 4,
	trailingComma: trailingComma ?? true,
	replacer: replacer ?? ( () => "empty" ),
} );

const jsStringify = <T>(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	obj: T,
	space = "\t",
	options: Partial<Options> = {},
): string => {

	const fullOptions = optionsWithDefaults( options );

	const { tabWidth } = fullOptions;

	if ( typeof space === "number" ) space = " ".repeat( space );
	const spaceWidth = space.replace( /\t/g, " ".repeat( tabWidth ?? 4 ) ).length;

	const replacer = fullOptions.replacer || ( fullOptions.replacer = ( obj, level = 0, curLength = 0 ) => {

		// No chance of these having .toJS
		if ( obj === undefined )
			return "undefined";

		if ( obj === null )
			return "null";

		// Allow values to have their own toJS function
		if ( typeof obj.toJS === "function" )
			return obj.toJS( obj, space, level, curLength, fullOptions );

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
			return stringifyArray( obj, space, level, curLength, spaceWidth, fullOptions );

		return stringifyObject( obj, space, level, curLength, spaceWidth, fullOptions );

	} );

	return replacer( obj );

};

export default jsStringify;
