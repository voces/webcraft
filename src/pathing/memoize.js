
export default fn => {

	let rootStore;

	const memoized = ( ...args ) => {

		if ( ! rootStore )
			rootStore = typeof args[ 0 ] === "object" ? new Map() : {};

		let store = rootStore;
		for ( let i = 0; i < args.length - 1; i ++ )

			if ( store instanceof Map )
				if ( store.has( args[ i ] ) ) store = store.get( args[ i ] );
				else {

					store.set( args[ i ], typeof args[ i ] === "object" ? new Map() : {} );
					store = store.get( args[ i ] );

				}
			else if ( args[ i ] in store ) store = store[ args[ i ] ];
			else store[ args[ i ] ] = store[ args[ i ] ] = typeof args[ i ] === "object" ? new Map() : {};

		const lastArg = args[ args.length - 1 ];

		if ( store instanceof Map )

			if ( store.has( lastArg ) ) {

				memoized.hits ++;
				return store.get( lastArg );

			} else {

				memoized.misses ++;
				store.set( lastArg, fn( ...args ) );
				return store.get( lastArg );

			}

		else if ( lastArg in store ) {

			memoized.hits ++;
			return store[ lastArg ];

		}

		memoized.misses ++;
		store[ lastArg ] = fn( ...args );
		return store[ lastArg ];

	};

	Object.assign( memoized, { hits: 0, misses: 0 } );

	return memoized;

};
