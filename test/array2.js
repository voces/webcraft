
export default ( x, y, fn = () => 0 ) =>
	Array( y ).fill().map( ( _, y ) =>
		Array( x ).fill().map( ( _, x ) =>
			fn( x, y ) ) );
