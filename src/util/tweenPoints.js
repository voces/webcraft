
const distance = ( { x: x1, y: y1 }, { x: x2, y: y2 } ) =>
	Math.sqrt( ( x2 - x1 ) ** 2 + ( y2 - y1 ) ** 2 );

// const elems = [];
const elems = false;

export default points => {

	points = points.filter( ( p, i ) => points.findIndex( p2 => p2.x === p.x && p2.y === p.y ) === i );

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
	annotatedPoints[ 0 ].end = points[ 1 ] ? distance( points[ 1 ], points[ 0 ] ) : 0;
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
	const func = points.length > 1 ? progress => {

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
			( annotatedPoints[ curPoint ].distance || Infinity );

		if ( isNaN( annotatedPoints[ curPoint ].x ) || isNaN( percentProgress * annotatedPoints[ curPoint ].xDeltaToNext ) ) throw "NaN";

		return {
			x: annotatedPoints[ curPoint ].x +
                percentProgress * annotatedPoints[ curPoint ].xDeltaToNext,
			y: annotatedPoints[ curPoint ].y +
                percentProgress * annotatedPoints[ curPoint ].yDeltaToNext,
		};

	} : () => points[ 0 ];

	let internalProgress = 0;
	return Object.assign( func, {
		distance: annotatedPoints[ points.length - 1 ].start,
		step: deltaProgress => {

			internalProgress += deltaProgress;
			return func( internalProgress );

		},
		origin: points[ 0 ],
		target: points[ points.length - 1 ],
		// https://math.stackexchange.com/questions/275529/check-if-line-intersects-with-circles-perimeter
		// https://www.geogebra.org/geometry/dm7vez7p
		radialStepBack: amount => {

			if ( points.length === 1 ) return points[ 0 ];

			let index = points.length - 2;
			const origin = points[ index + 1 ];

			let distance = Math.sqrt( ( origin.x - points[ index ].x ) ** 2 + ( origin.y - points[ index ].y ) ** 2 );
			while ( distance < amount && index >= 0 ) {

				index --;
				if ( index < 0 ) break;
				distance = Math.sqrt( ( origin.x - points[ index ].x ) ** 2 + ( origin.y - points[ index ].y ) ** 2 );

			}

			if ( index < 0 ) return points[ 0 ];

			const u = {
				x: points[ index ].x - origin.x,
				y: points[ index ].y - origin.y,
			};
			const v = {
				x: points[ index + 1 ].x - origin.x,
				y: points[ index + 1 ].y - origin.y,
			};

			const a = ( u.x - v.x ) ** 2 + ( u.y - v.y ) ** 2;
			const b = 2 * ( v.x * ( u.x - v.x ) + v.y * ( u.y - v.y ) );
			const c = v.x ** 2 + v.y ** 2 - amount ** 2;
			const disc = b ** 2 - 4 * a * c;
			const progress = ( - b + Math.sqrt( disc ) ) / ( 2 * a );

			return {
				x: points[ index + 1 ].x + ( points[ index ].x - points[ index + 1 ].x ) * progress,
				y: points[ index + 1 ].y + ( points[ index ].y - points[ index + 1 ].y ) * progress,
			};

		},
		toJSON: () => ( { points } ),
	} );

};
