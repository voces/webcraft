
import {
	colors,
	release as releaseColor,
	take as takeColor,
} from "./colors.js";
import game from "../index.js";

export default class Player {

	score = {
		bulldog: 1000,
	};
	sprites = [];
	isHere = true;
	crosserPlays = 0;

	constructor( data ) {

		Object.assign( this, data );

		if ( ! data.username || parseInt( data.username ) === data.id )
			Object.defineProperty( this, "username", {
				get: () => this.color ? this.color.name : this.id,
			} );

		game.players.push( this );

	}

	toJSON() {

		return {
			color: colors.indexOf( this.color ),
			id: this.id,
			username: this.username,
			score: this.score,
			crosserPlays: this.crosserPlays,
		};

	}

}

export const patchInState = playersState => {

	playersState.forEach( ( { color, id, ...playerData } ) => {

		const player = game.players.find( p => p.id === id ) || new Player( { ...playerData, id } );

		if ( ! player.color || player.color.index !== color ) {

			if ( player.color ) releaseColor( player.color );
			player.color = takeColor( color );

		}

		player.score = playerData.score;

	} );
	game.players.sort( ( a, b ) => a.id - b.id );

};
