
function _diffOptimized( setA, setB, prop ) {

	const aUnique = [],
		bUnique = [],
		shared = [];

	for ( let i = 0, n = 0; i < setA.length && n < setB.length; ) {

		if ( setA[ i ][ prop ] < setB[ n ][ prop ] ) {

			aUnique.push( setA[ i ] );
			i ++;

		} else if ( setA[ i ][ prop ] > setB[ n ][ prop ] ) {

			bUnique.push( setB[ n ] );
			n ++;

		} else {

			shared.push( setA[ i ] );
			i ++; n ++;

		}

		if ( setA[ i ] === undefined && n < setB.length ) bUnique.push( ...setB.slice( n ) );
		if ( setB[ n ] === undefined && i < setA.length ) aUnique.push( ...setA.slice( i ) );

	}

	return [ aUnique, bUnique, shared ];

}

// Assumes ordered
function diff( setA, setB, compare ) {

	if ( setA.length === 0 ) return [[], setB.slice( 0 ), []];
	if ( setB.length === 0 ) return [ setA.slice( 0 ), [], []];

	if ( typeof compare !== "function" ) return _diffOptimized( setA, setB, compare );

	const aUnique = [],
		bUnique = [],
		shared = [];

	for ( let i = 0, n = 0; i < setA.length || n < setB.length; ) {

		const relation = compare( setA[ i ], setB[ i ] );

		if ( relation < 0 ) {

			aUnique.push( setA[ i ] );
			i ++;

		} else if ( relation > 0 ) {

			bUnique.push( setB[ n ] );
			n ++;

		} else {

			shared.push( setA[ i ] );
			i ++; n ++;

		}

	}

	return [ aUnique, bUnique, shared ];

}

export { diff };
