
import { WORLD_TO_GRAPHICS_RATIO } from "../constants.js";
import tweenPoints from "../util/tweenPoints.js";
import Sprite from "./Sprite.js";
import game from "../index.js";

export default class Unit extends Sprite {

	// 380 in WC3
	speed = 5.938;
	weapon = {
		damage: 1,
		cooldown: 1.5,
		last: 0,
		range: 0.25,
	}
	facing = Math.PI / 2;

	constructor( props ) {

		super( props );

		if ( this.isMirror && game.localPlayer.unit && game.round.defenders.includes( game.localPlayer ) )
			this.elem.style.backgroundImage = "radial-gradient(rgba(0, 0, 255, 0.75), rgba(0, 0, 255, 0.75))";
		this.elem.style.borderRadius = this.radius * WORLD_TO_GRAPHICS_RATIO + "px";

	}

	walkTo( pathingMap, target ) {

		let renderProgress = 0;
		let path = tweenPoints( pathingMap.path( this, target ) );

		this.action = {
			update: delta => {

				const updateProgress = delta * this.speed;
				const { x, y } = path( updateProgress );
				if ( isNaN( x ) || isNaN( y ) ) throw new Error( `Returning NaN location x=${x} y=${y}` );

				if ( path.distance < updateProgress ) {

					this.setPosition( x, y );
					this.action = undefined;

				} else {

					// Update self
					this._setPosition( x, y );

					// Start new walk path
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
			toJSON: () => ( {
				name: "walkTo",
				path,
				target,
			} ),
		};

	}

	holdPosition() {

		this.action = {};

	}

	stop() {

		this.action = undefined;

	}

}
