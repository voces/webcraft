
export const stringMap = map => map
	.trim()
	.split( "\n" )
	.map( row => row
		.trim()
		.split( "" )
		.map( v => parseInt( v ) )
	);
