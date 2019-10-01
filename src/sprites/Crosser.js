
import { WORLD_TO_GRAPHICS_RATIO } from "../constants.js";
import tweenPoints from "../util/tweenPoints.js";
import Unit from "./Unit.js";
import dragSelect from "./dragSelect.js";
import game from "../index.js";
import { stop as stopPlacement, active as activePlacement } from "./obstructionPlacement.js";
import Blueprint from "./obstructions/Blueprint.js";

const BUILD_DISTANCE = 1.75;

export default class Crosser extends Unit {

    static radius = 0.5;

	// 380 in WC3 on fast
	speed = 5.9375;
	obstructions = [];

	constructor( ...args ) {

		super( ...args );

		this.addEventListener( "death", () => {

			// Kill all their sprites
			[ ...this.owner.sprites ].forEach( sprite =>
				sprite.kill() );

			// Cancel any active placements
			if ( activePlacement() ) stopPlacement();

		} );

	}

	buildAt( pathingMap, target, Obstruction ) {

		let renderProgress = 0;
		let rawPath = pathingMap.path( this, target );
		let path = tweenPoints( rawPath );
		const blueprint = this.owner === game.localPlayer && new Blueprint( { ...target, radius: Obstruction.radius } );

		this.action = {
			update: delta => {

				const updateProgress = delta * this.speed;
				const { x, y } = path( updateProgress );
				if ( isNaN( x ) || isNaN( y ) ) throw new Error( `Returning NaN location x=${x} y=${y}` );

				if ( path.distance < updateProgress + BUILD_DISTANCE ) {

					this.action = undefined;

					// If the calculated path gets us there, create the obstruction
					if ( rawPath[ rawPath.length - 1 ].x === target.x && rawPath[ rawPath.length - 1 ].y === target.y ) {

						const obstruction = new Obstruction( {
							x: target.x,
							y: target.y,
							owner: this.owner,
						} );

						pathingMap.removeEntity( this );

						if ( pathingMap.pathable( obstruction, target.x, target.y ) ) {

							pathingMap.addEntity( obstruction );
							this.obstructions.push( obstruction );

						} else
							obstruction.kill( { removeImmediately: true } );

						const position = pathingMap.nearestSpiralPathing( x, y, this );
						Object.assign( this, position );
						pathingMap.addEntity( this );

						// Otherwise assign final coordinates

					} else Object.assign( this, { x, y } );

				} else {

					// Update self
					this._x = x;
					this._y = y;
					pathingMap.updateEntity( this );

					// Start new build path
					rawPath = pathingMap.path( this, target );
					path = tweenPoints( rawPath );
					renderProgress = 0;

				}

				pathingMap.updateEntity( this );

			},
			render: delta => {

				renderProgress += delta * this.speed;
				const { x, y } = path( renderProgress );
				this.elem.style.left = ( x - this.radius ) * WORLD_TO_GRAPHICS_RATIO + "px";
				this.elem.style.top = ( y - this.radius ) * WORLD_TO_GRAPHICS_RATIO + "px";

			},
			cleanup: () => {

				if ( blueprint ) blueprint.kill();

			},
		};

	}

	ascend() {

		this.health = 0;
		this.action = undefined;
		dragSelect.removeSelectables( [ this.elem ] );
		if ( this._selected )
			dragSelect.setSelection(
				dragSelect.getSelection().filter( u => u !== this )
			);
		if ( this.owner ) {

			const index = this.owner.sprites.indexOf( this );
			if ( index >= 0 ) this.owner.sprites.splice( index, 1 );

		}
		if ( game.round ) {

			game.round.pathingMap.removeEntity( this );
			const index = game.round.sprites.indexOf( this );
			if ( index >= 0 ) game.round.sprites.splice( index, 1 );

		}
		// Cancel any active placements
		if ( activePlacement() ) stopPlacement();

		this.elem.classList.add( "ascend" );

		game.round.setTimeout( () => this.remove(), 1 );

	}

}
