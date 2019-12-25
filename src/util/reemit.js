
export default ( originalEmitter, type, newEmitter, newType = type ) =>
	originalEmitter.addEventListener( type, ( ...args ) =>
		newEmitter.dispatchEvent( newType, ...args ) );
