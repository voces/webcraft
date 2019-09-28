
import arenas from "./arenas/index.js";
import seal from "./util/seal.js";
import Round from "./Round.js";
import { TILE_NAMES } from "./constants.js";
import network from "./network.js";

const tilesElemnt = document.getElementById( "tiles" );

export default class Game {

	localPlayer;
	host;
	isHost = false;
    players = [];
    arena = arenas[ 0 ];

	settings = seal( {
		arenaIndex: 0,
		crossers: 1,
	} );

	setArena( arena ) {

		this.settings.arenaIndex = arena;
		this.arena = arenas[ arena ];

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

	start( { seed, time } ) {

		if ( this.round ) throw new Error( "A round is already in progress" );

		this.round = new Round( {
			seed,
			time: time / 1000,
			settings: this.settings,
			players: this.players,
		} );

		this.round.addEventListener( "end", () => {

			this.round.removeEventListeners();
			this.round = undefined;

			if ( this.isHost )
				this.stopUpdating();

		} );

		if ( this.isHost )
			this.startUpdating();

	}

	startUpdating() {

		this.interval = setInterval( () => network.send( { type: "update" } ), 100 );

	}

	stopUpdating() {

		clearInterval( this.interval );
		this.interval = undefined;

	}

	update( e ) {

		// Update is called for people who have recently joined
		if ( this.round )
			this.round.update( e.time / 1000 );

	}

}
