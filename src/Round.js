
import arenas from "./arenas/index.js";
import PathingMap from "./pathing/PathingMap.js";
import { TILE_TYPES } from "./constants.js";
import Crosser from "./sprites/Crosser.js";
import Defender from "./sprites/Defender.js";
import dragSelect from "./sprites/dragSelect.js";
import game from "./index.js";
import elo from "./players/elo.js";
import emitter from "./emitter.js";
import { panTo } from "./players/camera.js";
import network from "./network.js";
import {
	colors,
} from "./players/colors.js";

// A round starts upon construction
export default class Round {

	crossers = [];
	defenders = [];
	sprites = [];
	scores = 0;
	spriteId = 0;

	constructor( { time, settings, players } ) {

		emitter( this );
		this.lastUpdate = time;
		this.lastRender = Date.now() / 1000;
		this.settings = settings;
		this.players = [ ...players ];
		this.arena = arenas[ settings.arenaIndex ];
		this.pathingMap = new PathingMap( {
			pathing: this.arena.pathing,
			resolution: 2,
		} );

		this.pickTeams();

		setTimeout( () => {

			this.spawnUnits();
			this.startRendering();

		} );

	}

	pickTeams() {

		const remaining = [ ...this.players ];
		while ( remaining.length ) {

			const player = remaining.splice( Math.floor( game.random() * remaining.length ), 1 )[ 0 ];
			// const player = remaining.splice( 0, 1 )[ 0 ];
			if ( this.crossers.length < this.settings.crossers )
				this.crossers.push( player );
			else
				this.defenders.push( player );

		}

	}

	spawnUnits() {

		this.players.forEach( player => {

			const isCrosser = this.crossers.includes( player );
			const targetTile = isCrosser ? TILE_TYPES.START : TILE_TYPES.SPAWN;
			const Unit = isCrosser ? Crosser : Defender;

			// Create the unit
			const unit = player.unit = new Unit( {
				owner: player,
				x: 0,
				y: 0,
			} );

			// Place it
			let maxTries = 8192;
			while ( -- maxTries ) {

				const xRand = game.random() * this.pathingMap.widthWorld;
				const yRand = game.random() * this.pathingMap.heightWorld;

				if ( this.arena.tiles[ Math.floor( yRand / 2 ) ][ Math.floor( xRand / 2 ) ] !== targetTile )
					continue;

				const { x, y } = this.pathingMap.nearestSpiralPathing( xRand, yRand, unit );

				if ( this.arena.tiles[ Math.floor( y / 2 ) ][ Math.floor( x / 2 ) ] === targetTile ) {

					Object.assign( unit, { x, y } );
					this.pathingMap.addEntity( unit );

					break;

				}

			}
			if ( ! maxTries ) console.error( "Exhausted placement attempts" );

			// Select + pan to it
			if ( player === game.localPlayer ) {

				dragSelect.setSelection( [ unit.elem ] );
				panTo( unit );

			}

			// Add event listeners
			unit.addEventListener( "death", () => {

				player.unit = undefined;
				if ( isCrosser ) this.onCrosserRemoval();

			} );

		} );

	}

	onCrosserRemoval() {

		if ( this.crossers.some( p => p.unit && p.unit.health > 0 ) )
			return;

		this.end();

	}

	end() {

		elo( {
			mode: "standard",
			crossers: this.crossers,
			defenders: this.defenders,
			scores: this.scores,
		} );

		if ( game.newPlayers ) {

			game.newPlayers = false;
			game.receivedState = false;

			const randomPlayerIndex = Math.floor( game.random() * this.players.length );
			const randomPlayer = this.players[ randomPlayerIndex ];
			if ( randomPlayer === game.localPlayer )
				network.send( {
					type: "state",
					arena: game.settings.arenaIndex,
					players: game.players.map( p => ( {
						id: p.id, color:
						colors.indexOf( p.color ),
						score: p.score,
					} ) ),
				} );

		} else
			game.lastRoundEnd = game.lastUpdate;

		setTimeout( () => {

			[ ...this.sprites ].forEach( sprite => sprite.kill() );
			cancelAnimationFrame( this.requestedAnimationFrame );

		}, 1000 );

		setTimeout( () => {

			this.removeEventListeners();
			game.round = undefined;

		} );

	}

	render() {

		this.requestedAnimationFrame = requestAnimationFrame( () => this.render() );
		const newRender = Date.now();
		const delta = ( newRender - this.lastRender ) / 1000;
		this.lastRender = newRender;

		this.sprites.forEach( sprite =>
			sprite.action && sprite.action.render && sprite.action.render( delta ) );

	}

	startRendering() {

		this.requestedAnimationFrame = requestAnimationFrame( () => this.render() );

	}

	update( time ) {

		const delta = time - this.lastUpdate;
		if ( isNaN( delta ) ) throw new Error( `delta=${delta}` );
		this.lastUpdate = time;

		this.sprites.forEach( sprite => {

			if ( sprite.action )
				sprite.action.update && sprite.action.update( delta );

			else if ( sprite instanceof Defender ) {

				const { x, y } = sprite;

				const nearest = this.crossers.reduce( ( { bestUnit, bestDistance }, testPlayer ) => {

					const testUnit = testPlayer.unit;
					if ( ! testUnit || testUnit.health <= 0 )
						return { bestUnit, bestDistance };

					const testDistance = ( testUnit.x - x ) ** 2 + ( testUnit.y - y );

					if ( ! bestUnit || bestDistance > testDistance )
						return { bestUnit: testUnit, bestDistance: testDistance };

					return { bestUnit, bestDistance };

				}, {} ).bestUnit;

				if ( nearest )
					sprite.attack( nearest );

			}

			if ( sprite instanceof Crosser )

				if ( this.arena.tiles[ Math.floor( sprite.y / 2 ) ][ Math.floor( sprite.x / 2 ) ] === TILE_TYPES.END ) {

					sprite.ascend();
					this.scores ++;
					sprite.owner.sprite = undefined;

					setTimeout( () => this.onCrosserRemoval(), 1000 );

				}

		} );

	}

}
