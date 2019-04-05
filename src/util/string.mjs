
export const toCamelCase = str =>
	str
		.replace( /(?:^\w|[A-Z]|\b\w)/g, ( ltr, idx ) =>
			idx === 0 ? ltr.toLowerCase() : ltr.toUpperCase() )
		.replace( /\s+/g, "" );
