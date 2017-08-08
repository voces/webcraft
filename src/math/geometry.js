
const PI2 = Math.PI * 2;

// From http://www.mathopenref.com/coordpolygonarea2.html
function areaOfPolygon( polygon ) {

	let area = 0;

	for ( let i = 1; i < polygon.length; i ++ )
		area += ( polygon[ i - 1 ].x + polygon[ i ].x ) * ( polygon[ i - 1 ].y - polygon[ i ].y );

	return area;

}

function areaOfPolygons( polygons ) {

	let area = 0;

	for ( let i = 0; i < polygons.length; i ++ )
		area += areaOfPolygon( polygons[ i ] );

	return area;

}

function pointInPolygon( point, polygon ) {

	let inside = false;

    // Grab the first vertex, Loop through vertices
	for ( let i = 1, p = polygon[ 0 ]; i <= polygon.length; i ++ ) {

        //Grab the next vertex (to form a segment)
		const q = i === polygon.length ? polygon[ 0 ] : polygon[ i ];

        //Test if the point matches either vertex
		if ( q.y === point.y && ( q.x === point.x || p.y === point.y && q.x > point.x === p.x < point.x ) )
			return false;

        //Only consider segments whose (vertical) interval the point fits in
		if ( p.y < point.y !== q.y < point.y )

            //If one edge is to the right of us
			if ( p.x >= point.x )

                //And the other is as well (a wall)
				if ( q.x > point.x ) inside = ! inside;

				else {

                    //Otherwise calculate if we fall to left or right
					const d = ( p.x - point.x ) * ( q.y - point.y ) - ( q.x - point.x ) * ( p.y - point.y );

                    //We're on it (FLOAT POINT)
					if ( d >= - 1e-7 && d <= 1e-7 ) return false;

                    //We fall to the left
					else if ( d > 0 === q.y > p.y ) inside = ! inside;

				}

			else if ( q.x > point.x ) {

				const d = ( p.x - point.x ) * ( q.y - point.y ) - ( q.x - point.x ) * ( p.y - point.y );

				if ( d >= - 1e-7 && d <= 1e-7 ) return false;
				else if ( d > 0 === q.y > p.y ) inside = ! inside;

			}

		p = q;

	}

	return inside;

}

function pointInSomePolygon( point, polygons ) {

	for ( let i = 0; i < polygons.length; i ++ )
		if ( pointInPolygon( point, polygons ) ) return true;

	return false;

}

//True if n is between a or b inclusively
function inclusiveBetween( n, a, b ) {

	if ( n < 0 ) n += PI2;
	if ( a < 0 ) a += PI2;
	if ( b < 0 ) b += PI2;

	if ( Math.abs( a - n ) < 1e-7 ) return true;
	if ( Math.abs( b - n ) < 1e-7 ) return true;

	if ( a < b ) return a <= n && n <= b;
	if ( b < a ) return a <= n || n <= b;
	return true;

}

export default {
	areaOfPolygon,
	areaOfPolygons,
	pointInPolygon,
	pointInSomePolygon,
	inclusiveBetween
};

export {
    areaOfPolygon,
    areaOfPolygons,
    pointInPolygon,
    pointInSomePolygon,
	inclusiveBetween
};
