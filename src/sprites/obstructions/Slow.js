
import Sprite from "../Sprite.js";
import Obstruction from "./Obstruction.js";
import attack from "../actions/attack.js";
import tweenPoints from "../../util/tweenPoints.js";
import { WORLD_TO_GRAPHICS_RATIO } from "../../constants.js";
import game from "../../index.js";

class Projectile extends Sprite {

	static radius = 3;
	static speed = 4;
	static splash = 2.5;
	static maxHealth = Infinity;

	constructor( { producer, target, speed, ...props } ) {

		if ( props.x === undefined ) props.x = producer.x;
		if ( props.y === undefined ) props.y = producer.y;
		super( { ...props, selectable: false } );
		this.speed = speed === undefined ? this.constructor.speed : speed;
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
							if ( distance > this.constructor.splash )
								return;

							const actualDamage = target.damage( producer.weapon.damage );
							if ( producer.weapon.onDamage )
								producer.weapon.onDamage( target, actualDamage, producer.damage );

						} );

					this.remove();

				}

			},
		};

	}

}

const slowTimeout = target => game.round.setTimeout( () => {

	const effectIndex = target.effects.findIndex( e => e.type === "slow" );
	const effect = target.effects[ effectIndex ];

	target.speed = effect.oldSpeed;
	target.elem.style.backgroundImage = effect.oldBackgroundImage;
	target.effects.splice( effectIndex, 1 );

}, 5 );

export default class Slow extends Obstruction {

	static radius = 1;
	static maxHealth = 200;
	static buildTime = 10;
	static cost = { essence: 45 };

	autoAttack = true;

	weapon = {
		damage: 1,
		cooldown: 2.5,
		last: 0,
		range: 10,
		onDamage: target => {

			const existingEffect = target.effects.find( e => e.type === "slow" );
			if ( existingEffect ) {

				game.round.clearTimeout( existingEffect.timeout );
				existingEffect.timeout = slowTimeout( target );
				return;

			}

			const effect = {
				type: "slow",
				oldSpeed: target.speed,
				oldBackgroundImage: target.elem.style.backgroundImage,
				timeout: slowTimeout( target ),
			};

			target.speed = target.speed * 0.6;
			target.elem.style.backgroundImage += " radial-gradient(rgba(0, 0, 255, 0.25), rgba(0, 0, 255, 0.25))";

			target.effects.push( effect );

		},
		projectile: target => {

			new Projectile( { target, producer: this, owner: this.owner } );

		},
	}

	attack( target ) {

		attack( this, target );

	}

}
