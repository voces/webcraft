
// Similar to Object.seal, but throws when trying to access/set a property not
// in the object
export default obj => new Proxy( obj, {
	set: ( target, prop, value ) => {

		if ( ! ( prop in target ) )
			throw new Error( `Object does not have property '${prop}'` );

		target[ prop ] = value;

		return prop in target;

	},
	get: ( target, prop ) => {

		if ( ! ( prop in target ) )
			throw new Error( `Object does not have property '${prop}'` );

		return target[ prop ];

	},
} );
