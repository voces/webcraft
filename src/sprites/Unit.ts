
import { WORLD_TO_GRAPHICS_RATIO } from "../constants.js";
import { tweenPoints } from "../util/tweenPoints.js";
import game from "../index.js";
import { Sprite, SpriteProps, SpriteEvents } from "./Sprite.js";
import { Point } from "../pathing/PathingMap.js";
import { Player } from "../players/Player.js";
import attack from "./actions/attack.js";
import { Emitter } from "../emitter.js";

export type Weapon = {
	damage: number,
	cooldown: number,
	range: number,
	projectile: "instant" | ( <T extends Sprite>( target: Sprite, attacker: T ) => void ),
	last?: number,
	enabled: boolean,
	onDamage?: ( target: Sprite, damage: number, attacker: Sprite ) => void
}

export type UnitProps = SpriteProps & {
	isMirror?: boolean;
	owner: Player;
	weapon?: Weapon;
	speed?: number;
};

class Unit extends Sprite {

	static isUnit = ( sprite: Unit | Sprite ): sprite is Unit => sprite instanceof Unit

	speed: number;
	isMirror: boolean;
	owner!: Player;
	weapon?: Weapon;
	mirrors?: Unit[];

	static defaults = {
		...Sprite.defaults,
		isMirror: false,
		speed: 5.938,
	};

	constructor( {
		isMirror = Unit.defaults.isMirror,
		weapon,
		// 380 in WC3
		speed = Unit.defaults.speed,
		...props
	}: UnitProps ) {

		super( props );

		this.weapon = weapon;
		this.isMirror = isMirror;
		this.speed = speed;

		if ( this.isMirror && game.localPlayer && game.localPlayer.unit && this.round.defenders.includes( game.localPlayer ) )
			this.elem.style.backgroundImage = "radial-gradient(rgba(0, 0, 255, 0.75), rgba(0, 0, 255, 0.75))";
		this.elem.style.borderRadius = this.radius * WORLD_TO_GRAPHICS_RATIO + "px";

	}

	attack( target: Sprite ): void {

		if ( this.weapon?.enabled )
			attack( this, target );

	}

	walkTo( target: Point ): void {

		let renderProgress = 0;
		let path = tweenPoints( this.round.pathingMap.path( this, target ) );

		this.action = {
			update: ( delta: number ) => {

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
					path = tweenPoints( this.round.pathingMap.path( this, target ) );
					renderProgress = 0;

				}

			},
			render: ( delta: number ) => {

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

	holdPosition(): void {

		this.action = {};

	}

	stop(): void {

		this.action = undefined;

	}

}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
type UnitEvents = SpriteEvents

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Unit extends Emitter<UnitEvents> {}

export { Unit };
