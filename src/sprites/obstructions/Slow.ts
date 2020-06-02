
import { Sprite, SpriteProps, Effect } from "../Sprite.js";
import { Obstruction, ObstructionProps } from "./Obstruction.js";
import { tweenPoints } from "../../util/tweenPoints.js";
import { WORLD_TO_GRAPHICS_RATIO } from "../../constants.js";
import { Point } from "../../pathing/PathingMap.js";
import { Player } from "../../players/Player.js";
import { Unit, Weapon } from "../Unit.js";

type ProjectileProps = Omit<SpriteProps, "x" | "y"> & {
	producer: Sprite,
	target: Point,
	speed?: number,
	owner: Player,
	splash?: number,
	damage: number,
	onDamage?: ( target: Sprite, damage: number, projectile: Projectile ) => void,
	x?: number,
	y?: number,
}

class Projectile extends Sprite {

	static defaults = {
		...Sprite.defaults,
		radius: 3,
		speed: 4,
		splash: 2.5,
		maxHealth: Infinity,
		selectable: false,
	}

	speed: number;
	owner!: Player;
	splash: number;
	damageAmount: number;
	onDamage?: ( target: Sprite, damage: number, projectile: Projectile ) => void

	constructor( {
		producer,
		target,
		speed = Projectile.defaults.speed,
		splash = Projectile.defaults.splash,
		damage,
		onDamage,
		...props
	}: ProjectileProps ) {

		super( {
			...Projectile.defaults,
			...props,
			x: props.x ?? producer.x,
			y: props.y ?? producer.y,
		} );

		this.splash = splash;
		this.damageAmount = damage;
		this.onDamage = onDamage;

		this.speed = speed;
		this.elem.style.borderRadius = "50%";
		this.elem.style.backgroundColor = "transparent";
		this.elem.style.backgroundImage = "radial-gradient(rgba(0, 0, 255, 0.25), transparent)";

		const { x, y } = target;

		const path = tweenPoints( [
			{ x: this.x, y: this.y },
			{ x, y },
		] );
		const renderPath = tweenPoints( [
			{ x: this.x, y: this.y },
			{ x, y },
		] );

		this.action = {
			render: delta => {

				const { x, y } = renderPath.step( delta * ( this.speed || 0 ) );
				this.elem.style.left = ( x - this.radius ) * WORLD_TO_GRAPHICS_RATIO + "px";
				this.elem.style.top = ( y - this.radius ) * WORLD_TO_GRAPHICS_RATIO + "px";

			},
			update: delta => {

				const point = path.step( delta * ( this.speed || 0 ) );
				Object.assign( this, point );
				if ( path.remaining === 0 ) {

					this.action = undefined;

					this.owner.getEnemySprites()
						.filter( s => Number.isFinite( s.health ) )
						.forEach( target => {

							const distance = Math.sqrt( ( target.x - x ) ** 2 + ( target.y - y ) ** 2 );
							if ( distance > this.splash )
								return;

							const actualDamage = target.damage( this.damageAmount );
							if ( this.onDamage )
								this.onDamage( target, actualDamage, this );

						} );

					this.remove();

				}

			},
		};

	}

}

const slowTimeout = ( target: Sprite ) => target.round.setTimeout( () => {

	const effectIndex = target.effects.findIndex( e => e.type === "slow" );
	const effect = target.effects[ effectIndex ];

	if ( Unit.isUnit( target ) ) target.speed = effect.oldSpeed;
	target.elem.style.backgroundImage = effect.oldBackgroundImage;
	target.effects.splice( effectIndex, 1 );

}, 5 );

type SlowProps = ObstructionProps & {
	weapon?: Weapon,
	autoAttack?: boolean,
}

export class Slow extends Obstruction {

	static isSlow = ( sprite: Slow | Sprite ): sprite is Slow => sprite instanceof Slow

	static defaults = {
		...Obstruction.defaults,
		maxHealth: 200,
		buildTime: 10,
		cost: { essence: 10 },
		autoAttack: true,
		weapon: {
			enabled: true,
			damage: 1,
			cooldown: 2.5,
			last: 0,
			range: 10,
			onDamage: ( target: Sprite ): void => {

				if ( ! Unit.isUnit( target ) ) return;

				const existingEffect = target.effects.find( e => e.type === "slow" );
				if ( existingEffect ) {

					target.round.clearTimeout( existingEffect.timeout );
					existingEffect.timeout = slowTimeout( target );
					return;

				}

				const effect: Effect = {
					type: "slow",
					oldSpeed: target.speed,
					oldBackgroundImage: target.elem.style.backgroundImage,
					timeout: slowTimeout( target ),
				};

				target.speed = target.speed * 0.6;
				target.elem.style.backgroundImage += " radial-gradient(rgba(0, 0, 255, 0.25), rgba(0, 0, 255, 0.25))";

				target.effects.push( effect );

			},
			projectile: ( target: Sprite, attacker: Sprite ): void => {

				if ( ! Slow.isSlow( attacker ) ) return;

				new Projectile( {
					target,
					producer: attacker,
					owner: attacker.owner,
					damage: attacker.weapon.damage,
					onDamage: attacker.weapon.onDamage,
				} );

			},
		},
	}

	autoAttack: boolean;

	weapon: Weapon;

	constructor( {
		weapon = Slow.defaults.weapon,
		autoAttack = Slow.defaults.autoAttack,
		...props
	}: SlowProps ) {

		super( { ...props } );

		this.weapon = weapon;
		this.autoAttack = autoAttack;

	}

}
