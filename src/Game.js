
import arenas from "./arenas/index.js";
import seal from "./util/seal.js";
import Round from "./Round.js";
import { TILE_NAMES } from "./constants.js";
import { panTo } from "./players/camera.js";
import emitter from "./emitter.js";
import { document } from "./util/globals.js";

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
		duration: 120,
	} );

	constructor() {

		emitter( this );
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

		// No need to divide by 2 since we tiles have a resolution of 0.5
		panTo( {
			x: this.arena.tiles[ 0 ].length,
			y: this.arena.tiles.length,
			duration: 0,
		} );

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
		if ( this.round ) {

			this.round.update( time );
			this.dispatchEvent( "update", time );
			return;

		}

		if (
			this.players.length && this.receivedState &&
			( ! this.lastRoundEnd || time > this.lastRoundEnd + 2 )
		)
			this.start( { time } );

	}

	toJSON() {

		return {
			arena: this.settings.arenaIndex,
			lastRoundEnd: this.lastRoundEnd,
			players: this.players,
			round: this.round,
		};

	}

}
