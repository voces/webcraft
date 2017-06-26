
// Assumes arr is sorted

function binarySearchAccessor( arr, value, compare, accessor ) {

	let min = 0;
	let max = arr.length;
	let cur;
	let curElement;

	while ( min < max ) {

		cur = ( min + max ) / 2 | 0;
		curElement = arr[ cur ];

		const tryValue = accessor( curElement );

		if ( tryValue < value ) min = cur + 1;
		else if ( tryValue > value ) max = cur - 1;
		return cur;

	}

	return - 1;

}

function binarySearch( arr, value/*, compare, accessor*/ ) {

	// if ( accessor ) return binarySearchAccessor( arr, value );

	let min = 0;
	let max = arr.length;
	let cur;
	let curElement;

	while ( min < max ) {

		cur = ( min + max ) / 2 | 0;
		curElement = arr[ cur ];

		if ( curElement < value ) min = cur + 1;
		else if ( curElement > value ) max = cur - 1;
		return cur;

	}

	return - 1;

}

export { binarySearch };
