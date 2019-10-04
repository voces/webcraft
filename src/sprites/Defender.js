
import { WORLD_TO_GRAPHICS_RATIO } from "../constants.js";
import tweenPoints from "../util/tweenPoints.js";
import Unit from "./Unit.js";
import game from "../index.js";

export default class Defender extends Unit {

	static radius = 1;

	// 420 in WC3 on fast
	speed = 6.5625;
	weapon = {
		...this.weapon,
		damage: 40,
	}

	attack( target ) {

		const pathingMap = game.round.pathingMap;
		let path = tweenPoints( pathingMap.withoutEntity( target, () =>
			pathingMap.path( this, target ) ) );
		let renderProgress = 0;

		const recalcPath = ( { x, y } ) => pathingMap.withoutEntity( target, () => {

			// Update self
			if ( pathingMap.pathable( this, x, y ) ) {

				this._x = x;
				this._y = y;
				pathingMap.updateEntity( this );

			} else {

				const { x: newX, y: newY } = pathingMap.withoutEntity(
					this,
					() => pathingMap.nearestPathing( x, y, this )
				);
				this._x = newX;
				this._y = newY;
				pathingMap.updateEntity( this );

			}

			// Start new attack path
			path = tweenPoints( pathingMap.path( this, target ) );
			renderProgress = 0;

		} );

		this.action = {
			render: delta => {

				renderProgress += delta * this.speed;
				const { x, y } = path( renderProgress );

				const distanceToTarget = Math.sqrt( ( target.x - x ) ** 2 + ( target.y - y ) ** 2 );
				if ( distanceToTarget >= this.weapon.range + this.radius + target.radius ) {

					this.elem.style.left = ( x - this.radius ) * WORLD_TO_GRAPHICS_RATIO + "px";
					this.elem.style.top = ( y - this.radius ) * WORLD_TO_GRAPHICS_RATIO + "px";

				}

			},
			update: delta => {

				const updateProgress = delta * this.speed;
				const { x, y } = path( updateProgress );

				if ( target.health <= 0 ) {

					Object.assign( this, { x, y } );
					this.action = undefined;
					return;

				}

				// Within range to attack
				const distanceToTarget = Math.sqrt( ( target.x - x ) ** 2 + ( target.y - y ) ** 2 );
				if ( distanceToTarget < this.weapon.range + this.radius + target.radius )

					// Cooldown
					if ( ! this.weapon.last || this.weapon.last + this.weapon.cooldown < game.round.lastUpdate ) {

						target.damage( this.weapon.damage );
						this.elem.classList.add( "attack" );
						game.round.setTimeout(
							() => this.elem && this.elem.classList.remove( "attack" ),
							0.250
						);
						this.weapon.last = game.round.lastUpdate;

						if ( target.health <= 0 ) {

							Object.assign( this, { x, y } );
							this.action = undefined;

						}

					} else {

						recalcPath( { x, y } );

					}

				else recalcPath( { x, y } );

			},
		};

	}

}
