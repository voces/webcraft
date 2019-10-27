
import arenas from "./arenas/index.js";
import PathingMap from "./pathing/PathingMap.js";
import { TILE_TYPES } from "./constants.js";
import Crosser from "./sprites/Crosser.js";
import Defender from "./sprites/Defender.js";
import dragSelect from "./sprites/dragSelect.js";
import game from "./index.js";
import elo, { updateDisplay } from "./players/elo.js";
import emitter from "./emitter.js";
import { panTo } from "./players/camera.js";
import network from "./network.js";
import { requestAnimationFrame, cancelAnimationFrame } from "./util/globals.js";
import Resource from "./sprites/obstructions/Resource.js";

// A round starts upon construction
export default class Round {

	crossers = [];
	defenders = [];
	sprites = [];
	scores = 0;
	spriteId = 0;
	// Replace with a heap
	intervals = [];
	timeouts = [];

	constructor( { time, settings, players } ) {

		if ( ! game.round ) game.round = this;
		emitter( this );
		this.lastUpdate = time;
		this.lastRender = Date.now() / 1000;
		this.settings = settings;
		this.players = [ ...players ];
		this.arena = arenas[ settings.arenaIndex ];
		this.pathingMap = new PathingMap( {
			pathing: this.arena.pathing,
			layers: this.arena.layers,
			resolution: 2,
		} );
		this.expireAt = time + settings.duration;

		this.pickTeams();
		this.grantResources();
		this.spawnUnits();
		this.startRendering();

	}

	pickTeams() {

		const remaining = [ ...this.players ];
		while ( remaining.length ) {

			const lowPlays = Math.min( ...remaining.map( p => p.crosserPlays ) );
			const low = remaining.filter( p => p.crosserPlays === lowPlays );

			const player = low.splice( Math.floor( game.random() * low.length ), 1 )[ 0 ];
			remaining.splice( remaining.indexOf( player ), 1 );
			if ( this.crossers.length < this.settings.crossers ) {

				this.crossers.push( player );
				player.crosserPlays ++;

			} else
				this.defenders.push( player );

		}

		updateDisplay();

	}

	grantResources() {

		for ( const team in this.settings.resources ) {

			const resources = Object.fromEntries(
				Object.entries( this.settings.resources[ team ] )
					.map( ( [ key, { starting } ] ) => [ key, starting ] )
			);
			this[ team ].forEach( crosser => Object.assign( crosser.resources, resources ) );

		}

	}

	_spawnUnit( player, Unit, targetTile ) {

		// Create the unit
		const unit = ( player || {} ).unit = new Unit( {
			owner: player,
			x: 0,
			y: 0,
		} );

		// Place it
		let maxTries = 8192;
		while ( -- maxTries ) {

			const xRand = game.random() * this.pathingMap.widthWorld;
			const yRand = game.random() * this.pathingMap.heightWorld;

			if ( this.arena.tiles[ Math.floor( yRand ) ][ Math.floor( xRand ) ] !== targetTile )
				continue;

			const { x, y } = this.pathingMap.nearestSpiralPathing( xRand, yRand, unit );

			if ( this.arena.tiles[ Math.floor( y ) ][ Math.floor( x ) ] === targetTile ) {

				unit.setPosition( x, y );
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
		if ( player )
			unit.addEventListener( "death", () => {

				player.unit = undefined;
				if ( unit instanceof Crosser ) this.onCrosserRemoval();

			} );

	}

	spawnUnits() {

		this.players.forEach( player => {

			const isCrosser = this.crossers.includes( player );
			const targetTile = isCrosser ? TILE_TYPES.START : TILE_TYPES.SPAWN;
			const Unit = isCrosser ? Crosser : Defender;
			this._spawnUnit( player, Unit, targetTile );

		} );

		if ( this.players.length === 1 )
			this._spawnUnit( null, Defender, TILE_TYPES.SPAWN );

	}

	onCrosserRemoval() {

		if ( this.crossers.some( p => p.unit && p.unit.health > 0 ) )
			return;

		this.end();

	}

	end() {

		elo( {
			mode: game.settings.mode,
			crossers: this.crossers,
			defenders: this.defenders,
			scores: this.scores,
		} );

		if ( game.newPlayers ) {

			game.newPlayers = false;
			game.receivedState = false;

			if ( network.isHost )
				network.send( {
					type: "state",
					state: game,
				} );

		} else
			game.lastRoundEnd = game.lastUpdate;

		this.setTimeout( () => {

			[ ...this.sprites ].forEach( sprite => sprite.kill() );
			cancelAnimationFrame( this.requestedAnimationFrame );

			this.setTimeout( () => {

				this.removeEventListeners();
				game.round = undefined;

			}, 0.25 );

		}, 1 );

	}

	setInterval( fn, interval = 0.05, oncePerUpdate = true ) {

		const id = this.intervals.id || 0;

		this.intervals.push( {
			fn,
			next: this.lastUpdate + interval,
			interval,
			oncePerUpdate,
			id,
		} );

		this.intervals.id = id + 1;

		return id;

	}

	clearInterval( id ) {

		const index = this.intervals.findIndex( i => i.id === id );
		if ( index >= 0 ) this.intervals.splice( index, 1 );

	}

	setTimeout( fn, timeout = 0.05 ) {

		const id = this.timeouts.id || 0;

		this.timeouts.push( { fn, next: this.lastUpdate + timeout, id } );

		this.timeouts.id = id + 1;

		return id;

	}

	clearTimeout( id ) {

		const index = this.timeouts.findIndex( i => i.id === id );
		if ( index >= 0 ) this.timeouts.splice( index, 1 );

	}

	onPlayerLeave() {

		if ( this.players.some( player => player.isHere ) ) return;

		game.round = undefined;

	}

	updateSprites( delta ) {

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

				if ( this.arena.tiles[ Math.floor( sprite.y ) ][ Math.floor( sprite.x ) ] === TILE_TYPES.END ) {

					sprite.ascend();
					this.scores ++;
					sprite.owner.sprite = undefined;

					this.onCrosserRemoval();

				}

		} );

	}

	updateIntervals( time ) {

		this.intervals.sort( ( a, b ) => a.next - b.next );
		const intervals = [ ...this.intervals ];
		let intervalIndex = 0;
		while ( intervals[ intervalIndex ] && intervals[ intervalIndex ].next < time ) {

			const interval = intervals[ intervalIndex ];
			interval.next = intervalIndex.oncePerUpdate ? time + interval.interval : interval.next + interval.interval;
			interval.fn();
			if ( interval.oncePerUpdate || interval.next > time ) intervalIndex ++;

		}

	}

	updateTimeouts( time ) {

		this.timeouts.sort( ( a, b ) => a.next - b.next );
		const timeouts = [ ...this.timeouts ];
		let timeoutIndex = 0;
		while ( timeouts[ timeoutIndex ] && timeouts[ timeoutIndex ].next < time ) {

			const timeout = timeouts[ timeoutIndex ];
			timeout.fn();
			timeoutIndex ++;
			const index = this.timeouts.indexOf( timeout );
			if ( index >= 0 ) this.timeouts.splice( index, 1 );

		}

	}

	updateResources( delta ) {

		const factor = this.crossers.reduce(
			( sum, p ) =>
				sum + p.sprites.reduce( ( sum, s ) =>
					sum + ( s instanceof Resource ? 1 : 0 ), 0 ),
			1
		) / 2;

		this.crossers.filter( p => p.unit ).forEach( crosser => {

			for ( const resource in this.settings.resources.crossers )
				crosser.resources[ resource ] +=
					this.settings.resources.crossers[ resource ].rate * delta * factor;

		} );

	}

	update( time ) {

		// meta info
		const delta = time - this.lastUpdate;
		if ( isNaN( delta ) ) throw new Error( `delta=${delta}` );
		this.lastUpdate = time;

		// End of round
		if ( time > this.expireAt )
			this.crossers.forEach( c => c.unit && c.unit.kill() );

		this.updateSprites( delta );
		this.updateIntervals( time );
		this.updateTimeouts( time );
		this.updateResources( delta );

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

	toJSON() {

		return {
			crossers: this.crossers.map( c => c.id ),
			defenders: this.defenders.map( d => d.id ),
			expireAt: this.expireAt,
			lastUpdate: this.lastUpdate,
			sprites: this.sprites,
		};

	}

}
