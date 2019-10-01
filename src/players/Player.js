
export default class Player {

	score = {
		standard: 1000,
	};
	sprites = [];
	isHere = true;

	constructor( data ) {

		Object.assign( this, data );

	}

}
