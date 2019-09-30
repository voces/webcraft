
import { WORLD_TO_GRAPHICS_RATIO } from "../constants.js";
import tweenPoints from "../util/tweenPoints.js";
import Unit from "./Unit.js";
import game from "../index.js";

export default class Defender extends Unit {

	static radius = 1;

	// 420 in WC3 on fast
	speed = 6.5625;

	attack( target ) {

		game.round.pathingMap.removeEntity( target );
		let path = tweenPoints( game.round.pathingMap.path( this, target ) );
		game.round.pathingMap.addEntity( target );
		let renderProgress = 0;

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
				if ( distanceToTarget < this.weapon.range + this.radius + target.radius ) {

					// Cooldown
					if ( ! this.weapon.last || this.weapon.last + this.weapon.cooldown < game.round.lastUpdate ) {

						target.damage( this.weapon.damage );
						this.elem.classList.add( "attack" );
						setTimeout( () => this.elem && this.elem.classList.remove( "attack" ), 250 );
						this.weapon.last = game.round.lastUpdate;

						if ( target.health <= 0 ) {

							Object.assign( this, { x, y } );
							this.action = undefined;

						}

					}

				} else {

					// Update self
					if ( game.round.pathingMap.pathable( this, x, y ) ) {

						this._x = x;
						this._y = y;
						game.round.pathingMap.updateEntity( this );

					} else {

						const { x: newX, y: newY } = game.round.pathingMap.withoutEntity(
							this,
							() => game.round.pathingMap.nearestPathing( x, y, this )
						);
						this._x = newX;
						this._y = newY;
						game.round.pathingMap.updateEntity( this );

					}

					// Start new attack path
					game.round.pathingMap.removeEntity( target );
					path = tweenPoints( game.round.pathingMap.path( this, target ) );
					game.round.pathingMap.addEntity( target );
					renderProgress = 0;

				}

			},
		};

	}

}
