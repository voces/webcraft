
export default class Player {

	score = {
		standard: 1000,
	};
	sprites = [];
	isHere = true;

	constructor( data ) {

		Object.assign( this, data );

		if ( ! data.username || parseInt( data.username ) === data.id )
			Object.defineProperty( this, "username", {
				get: () => this.color ? this.color.name : this.id,
			} );

	}

}
