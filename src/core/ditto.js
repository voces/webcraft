
function ditto( target = () => {} ) {

	return new Proxy( target, {
		get: ( target, property ) => {

			if ( target[ property ] ) return target[ property ];
			return target[ property ] = ditto();

		}
	} );

}

export default ditto;
