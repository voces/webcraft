
const distance = ( { x: x1, y: y1 }, { x: x2, y: y2 } ) =>
	Math.sqrt( ( x2 - x1 ) ** 2 + ( y2 - y1 ) ** 2 );

// const elems = [];
const elems = false;

export default points => {

	if ( points.length === 1 ) return Object.assign( () => points[ 0 ], { distance: 0 } );

	if ( typeof document !== "undefined" )

		if ( elems ) {

			elems.forEach( elem => document.body.removeChild( elem ) );
			elems.splice( 0 );
			points.forEach( p => {

				const div = document.createElement( "div" );
				div.style.position = "absolute";
				div.style.top = p.y * 32 - 2 + "px";
				div.style.left = p.x * 32 - 2 + "px";
				div.style.zIndex = 10000;
				div.style.width = "4px";
				div.style.height = "4px";
				div.style.background = "black";
				document.body.appendChild( div );
				elems.push( div );

			} );

		}

	const annotatedPoints = points.map( p => ( { x: p.x, y: p.y } ) );
	annotatedPoints[ 0 ].start = 0;
	annotatedPoints[ 0 ].end = distance( points[ 1 ], points[ 0 ] );
	for ( let i = 0; i < points.length; i ++ ) {

		if ( i > 0 )

			annotatedPoints[ i ].start = annotatedPoints[ i - 1 ].end;

		if ( i < points.length - 1 ) {

			annotatedPoints[ i ].xDeltaToNext = annotatedPoints[ i + 1 ].x - annotatedPoints[ i ].x;
			annotatedPoints[ i ].yDeltaToNext = annotatedPoints[ i + 1 ].y - annotatedPoints[ i ].y;
			annotatedPoints[ i ].end = annotatedPoints[ i ].start +
				distance( points[ i ], points[ i + 1 ] );
			annotatedPoints[ i ].distance = annotatedPoints[ i ].end - annotatedPoints[ i ].start;

		}

	}

	let curPoint = 0;
	const func = progress => {

		if ( progress < 0 )
			throw new Error( "Progress should be greater than 0" );

		while ( progress < annotatedPoints[ curPoint ].start )
			curPoint --;

		while ( progress > annotatedPoints[ curPoint ].end && curPoint < points.length - 1 )
			curPoint ++;

		// Cap at the end
		if ( annotatedPoints[ curPoint ].end === undefined ) return annotatedPoints[ curPoint ];

		// Calc percentage progress
		const percentProgress = ( progress - annotatedPoints[ curPoint ].start ) /
			annotatedPoints[ curPoint ].distance;

		if ( isNaN( annotatedPoints[ curPoint ].x ) || isNaN( percentProgress * annotatedPoints[ curPoint ].xDeltaToNext ) ) throw "NaN";

		return {
			x: annotatedPoints[ curPoint ].x +
                percentProgress * annotatedPoints[ curPoint ].xDeltaToNext,
			y: annotatedPoints[ curPoint ].y +
                percentProgress * annotatedPoints[ curPoint ].yDeltaToNext,
		};

	};

	let internalProgress = 0;
	return Object.assign( func, {
		distance: annotatedPoints[ points.length - 1 ].start,
		step: deltaProgress => {

			internalProgress += deltaProgress;
			return func( internalProgress );

		},
		target: points[ points.length - 1 ],
		toJSON: () => ( { points } ),
	} );

};
