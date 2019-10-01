
import arenas from "./arenas/index.js";
import seal from "./util/seal.js";
import Round from "./Round.js";
import { TILE_NAMES } from "./constants.js";

const tilesElemnt = document.getElementById( "tiles" );

export default class Game {

	localPlayer;
	host;
    players = [];
	arena;
	receivedState = false;
	newPlayers = false;

	settings = seal( {
		arenaIndex: 0,
		crossers: 1,
	} );

	constructor() {

		this.setArena( 0 );

	}

	setArena( arenaIndex ) {

		this.settings.arenaIndex = arenaIndex;
		this.arena = arenas[ arenaIndex ];

		tilesElemnt.innerHTML = "";
		for ( let y = 0; y < this.arena.layers.length; y ++ ) {

			const row = document.createElement( "div" );
			row.classList.add( "row" );
			for ( let x = 0; x < this.arena.layers[ y ].length; x ++ ) {

				const tile = document.createElement( "div" );
				tile.classList.add(
					"tile",
					`layer-${this.arena.layers[ y ][ x ]}`,
					TILE_NAMES[ this.arena.tiles[ y ][ x ] ]
				);
				row.appendChild( tile );

			}
			tilesElemnt.appendChild( row );

		}

	}

	nextArena() {

		this.settings.arenaIndex = ( this.settings.arenaIndex + 1 ) % arenas.length;

	}

	previousArena() {

		this.settings.arenaIndex =
			this.settings.arenaIndex ?
				this.settings.arenaIndex - 1 :
				arenas.length - 1;

	}

	start( { time } ) {

		if ( this.round ) throw new Error( "A round is already in progress" );

		this.round = new Round( {
			time,
			settings: this.settings,
			players: this.players,
		} );

	}

	update( e ) {

		const time = e.time / 1000;
		this.lastUpdate = time;

		// Update is called for people who have recently joined
		if ( this.round )
			return this.round.update( time );

		if ( this.receivedState && ( ! this.lastRoundEnd || time > this.lastRoundEnd + 2 ) ) {

			console.log( "starting", e.time, this.lastRoundEnd );
			this.start( { time } );

		}

	}

}
