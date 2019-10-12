
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
		arenaIndex: - 1,
		crossers: 1,
		duration: 120,
	} );

	constructor() {

		emitter( this );
		this.setArena( 2 );
		// this.setArena( Math.floor( ( this.random || Math.random )() * arenas.length ) );

	}

	setArena( arenaIndex ) {

		if ( this.settings.arenaIndex === arenaIndex )
			return;

		this.settings.arenaIndex = arenaIndex;
		this.arena = arenas[ arenaIndex ];

		tilesElemnt.innerHTML = "";
		for ( let y = 0; y < this.arena.tiles.length; y ++ ) {

			const row = document.createElement( "div" );
			row.classList.add( "row" );
			for ( let x = 0; x < this.arena.tiles[ y ].length; x ++ ) {

				const tile = document.createElement( "div" );
				tile.classList.add(
					"tile",
					`layer-${this.arena.layers[ y ][ x ]}`,
					TILE_NAMES[ this.arena.tiles[ y ][ x ] ] || "void"
				);
				row.appendChild( tile );

			}
			tilesElemnt.appendChild( row );

		}

		panTo( {
			x: this.arena.tiles[ 0 ].length / 2,
			y: this.arena.tiles.length / 2,
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

		const plays = this.players[ 0 ].crosserPlays;
		const newArena = plays >= 3 && this.players.every( p =>
			p.crosserPlays === plays || p.crosserPlays >= 5 );

		if ( newArena ) {

			this.setArena( Math.floor( this.random() * arenas.length ) );
			this.players.forEach( p => p.crosserPlays = 0 );

		}

		this.settings.crossers = this.players.length === 3 ?
			1 : // hardcode 1v2
			Math.ceil( this.players.length / 2 ); // otherwise just do 1v0, 1v1, 1v2, 2v2, 3v2, 3v3, 4v3, etc

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
			lastUpdate: this.lastUpdate,
			players: this.players,
			round: this.round,
		};

	}

}
