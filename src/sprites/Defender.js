
import { WORLD_TO_GRAPHICS_RATIO } from "../constants.js";
import tweenPoints from "../util/tweenPoints.js";
import Unit from "./Unit.js";

export default class Defender extends Unit {

	static radius = 1;
	range = 0.25;

	// 420 in WC3 on fast
	speed = 6.5625;

	attack( pathingMap, target ) {

		pathingMap.removeEntity( target );
		let path = tweenPoints( pathingMap.path( this, target ) );
		pathingMap.addEntity( target );
		let renderProgress = 0;

		this.action = {
			render: delta => {

				renderProgress += delta * this.speed;
				const { x, y } = path( renderProgress );
				this.elem.style.left = ( x - this.radius ) * WORLD_TO_GRAPHICS_RATIO + "px";
				this.elem.style.top = ( y - this.radius ) * WORLD_TO_GRAPHICS_RATIO + "px";

			},
			update: delta => {

				const updateProgress = delta * this.speed;
				const { x, y } = path( updateProgress );

				const distanceToTarget = Math.sqrt( ( target.x - x ) ** 2 + ( target.y - y ) ** 2 );
				if ( distanceToTarget < this.range + this.radius + target.radius ) {

					target.kill();
					Object.assign( this, { x, y } );
					this.action = undefined;

				} else {

					// Update self
					if ( pathingMap.pathable( this, x, y ) ) {

						this._x = x;
						this._y = y;
						pathingMap.updateEntity( this );

					} else {

						const { x: newX, y: newY } = pathingMap.withoutEntity( this, () => pathingMap.nearestPathing( x, y, this ) );
						this._x = newX;
						this._y = newY;
						pathingMap.updateEntity( this );

					}

					// Start new attack path
					pathingMap.removeEntity( target );
					path = tweenPoints( pathingMap.path( this, target ) );
					pathingMap.addEntity( target );
					renderProgress = 0;

				}

			},
		};

	}

}
