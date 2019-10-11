
const leftTrim = v => {

	const match = v.match( /^\s+/ );
	return match ? match[ 0 ].length : 0;

};

const commonLeftTrim = rows =>
	rows.reduce( ( min, row ) =>
		Math.min( min, leftTrim( row ) ), leftTrim( rows[ 0 ] ) );

export const stringMap = map => {

	const rows = map
		.split( "\n" )
		.filter( v => v.trim() );

	const minLeftTrim = commonLeftTrim( rows );

	return rows
		.map( row => row
			.trimRight()
			.slice( minLeftTrim )
			.split( "" )
			.map( v => parseInt( v ) ) );

};

export const recursiveMap = ( arr, fn ) =>
	arr.map( v => Array.isArray( v ) ? recursiveMap( v, fn ) : fn( v ) );
