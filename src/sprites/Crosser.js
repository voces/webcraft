
import { WORLD_TO_GRAPHICS_RATIO } from "../constants.js";
import tweenPoints from "../util/tweenPoints.js";
import Unit from "./Unit.js";
import dragSelect from "./dragSelect.js";
import game from "../index.js";
import { stop as stopPlacement, active as activePlacement } from "./obstructionPlacement.js";
import Blueprint from "./obstructions/Blueprint.js";
import { appendErrorMessage } from "../ui/chat.js";

// Math.SQRT2 (~1.41) allows building tinies across diag space
const BUILD_DISTANCE = 1.4;

export default class Crosser extends Unit {

	static radius = 0.5;
	static priority = 1;

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
		let path = tweenPoints( pathingMap.path( this, target ) );
		const blueprint = this.owner === game.localPlayer && new Blueprint( { ...target, radius: Obstruction.radius } );

		this.action = {
			update: delta => {

				const updateProgress = delta * this.speed;
				const { x, y } = path( updateProgress );
				if ( isNaN( x ) || isNaN( y ) ) throw new Error( `Returning NaN location x=${x} y=${y}` );

				const actualDistance = Math.sqrt( ( x - target.x ) ** 2 + ( y - target.y ) ** 2 );
				if ( actualDistance < BUILD_DISTANCE ) {

					this.action = undefined;

					if ( Obstruction.cost ) {

						const check = game.localPlayer.checkResources( Obstruction.cost );
						if ( check.length ) {

							appendErrorMessage( `Not enough ${check.join( " " )}` );
							return;

						}

						game.localPlayer.subtractResources( Obstruction.cost );

					}

					const obstruction = new Obstruction( {
						x: target.x,
						y: target.y,
						owner: this.owner,
					} );

					pathingMap.withoutEntity( this, () => {

						if ( pathingMap.pathable( obstruction, target.x, target.y ) ) {

							pathingMap.addEntity( obstruction );
							this.obstructions.push( obstruction );

						} else
							obstruction.kill( { removeImmediately: true } );

						const { x, y } = path.radialStepBack( BUILD_DISTANCE );
						this.setPosition( pathingMap.nearestSpiralPathing( x, y, this ) );

					} );

					// We're never going to get there

				} else if ( path.distance < updateProgress ) {

					this.action = undefined;
					this.setPosition( x, y );

				} else {

					// Update self
					this._setPosition( x, y );

					// Start new build path
					path = tweenPoints( pathingMap.path( this, target ) );
					renderProgress = 0;

				}

			},
			render: delta => {

				renderProgress += delta * this.speed;
				const { x, y } = path( renderProgress );
				this.elem.style.left = ( x - this.radius ) * WORLD_TO_GRAPHICS_RATIO + "px";
				this.elem.style.top = ( y - this.radius ) * WORLD_TO_GRAPHICS_RATIO + "px";

			},
			cleanup: () => blueprint && blueprint.kill( { removeImmediately: true } ),
			toJSON: () => ( {
				name: "buildAt",
				obstruction: Obstruction.name,
				target,
				path,
			} ),
		};

	}

	ascend() {

		this._health = 0;
		this.action = undefined;
		dragSelect.removeSelectables( [ this.elem ] );
		if ( this._selected )
			dragSelect.setSelection(
				dragSelect.selection.filter( u => u !== this )
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
