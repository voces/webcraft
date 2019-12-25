
export default class Force {

    name;
	players = []
	shareVision = true;
	shareControl = false;

	constructor( { name, players, shareVision, shareControl } = {} ) {

		if ( name ) this.name = name;
		if ( players ) this.players.push( ...players );
		if ( shareVision !== undefined ) this.shareVision = shareVision;
		if ( shareControl !== undefined ) this.shareControl = shareControl;

	}

}
