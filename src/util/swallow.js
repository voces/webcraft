
const swallow = () => new Proxy( Object.assign( () => {}, { valueOf: () => 0 } ), {
	get: ( _, prop ) => {

		if ( prop === Symbol.toPrimitive ) return () => 0;
		return swallow();

	},
	apply: () => swallow(),
} );

export default swallow;
