
export default host => {

	let events = {};

	host.addEventListener = ( name, callback ) => {

		if ( ! events[ name ] ) events[ name ] = [];
		events[ name ].push( callback );

	};

	host.removeEventListener = ( name, callback ) => {

		const callbacks = events[ name ] ? [ ...events[ name ] ] : undefined;
		if ( ! callbacks ) return;

		const index = callbacks.find( callback );
		if ( index >= 0 ) callbacks.splice( index, 1 );

	};

	host.removeEventListeners = name => {

		if ( ! name ) {

			events = {};
			return;

		}

		events[ name ] = [];

	};

	host.dispatchEvent = ( name, data ) => {

		const callbacks = events[ name ] ? [ ...events[ name ] ] : undefined;
		if ( ! callbacks ) return;

		callbacks.forEach( callback => callback.call( host, data ) );

	};

	return host;

};
