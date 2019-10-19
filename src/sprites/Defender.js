
import { WORLD_TO_GRAPHICS_RATIO, MIRROR_SEPARATION } from "../constants.js";
import tweenPoints from "../util/tweenPoints.js";
import Unit from "./Unit.js";
import game from "../index.js";

const getMirroringPosition = ( pos, entity, layer ) => {

	const nearest = game.round.pathingMap.nearestSpiralPathing( pos.x, pos.y, entity );

	if ( game.round.pathingMap.layer( nearest.x, nearest.y ) === layer )
		return nearest;

	return game.round.pathingMap.nearestSpiralPathing( nearest.x, nearest.y, entity, layer );

};

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

		const recalcPath = ( { x, y } ) => {

			// Update self
			this._setPosition( x, y );

			// Start new attack path
			path = tweenPoints( pathingMap.withoutEntity( target, () => pathingMap.path( this, target ) ) );
			renderProgress = 0;

		};

		this.action = {
			render: delta => {

				renderProgress += delta * this.speed;
				let { x, y } = path( renderProgress );

				const distanceToTarget = Math.sqrt( ( target.x - x ) ** 2 + ( target.y - y ) ** 2 );
				const range = this.weapon.range + this.radius + target.radius;
				if ( distanceToTarget < range ) {

					const angle = Math.atan2( y - target.y, x - target.x );
					x = target.x + range * Math.cos( angle );
					y = target.y + range * Math.sin( angle );

				}

				this.elem.style.left = ( x - this.radius ) * WORLD_TO_GRAPHICS_RATIO + "px";
				this.elem.style.top = ( y - this.radius ) * WORLD_TO_GRAPHICS_RATIO + "px";

			},
			update: delta => {

				const updateProgress = delta * this.speed;
				const { x, y } = path( updateProgress );

				if ( target.health <= 0 ) {

					this.setPosition( x, y );
					this.action = undefined;
					return;

				}

				// Within range to attack
				const distanceToTarget = Math.sqrt( ( target.x - x ) ** 2 + ( target.y - y ) ** 2 );
				if ( distanceToTarget < this.weapon.range + this.radius + target.radius ) {

					// Cooldown
					if ( ! this.weapon.last || this.weapon.last + this.weapon.cooldown < game.round.lastUpdate ) {

						const ignoreArmor = isNaN( target.buildProgress ) || target.buildProgress < 1;
						const effectiveArmor = ignoreArmor ? target.armor : 0;
						const actualDamage = this.isMirror ? 0 : this.weapon.damage * ( 1 - effectiveArmor );

						target.damage( actualDamage );

						this.elem.classList.add( "attack" );
						game.round.setTimeout(
							() => this.elem && this.elem.classList.remove( "attack" ),
							0.250
						);
						this.weapon.last = game.round.lastUpdate;

						if ( target.health <= 0 ) {

							this.setPosition( x, y );
							this.action = undefined;

						}

					}

				} else recalcPath( { x, y } );

			},
			toJSON: () => ( {
				name: "attack",
				path,
				target: target.id,
			} ),
		};

	}

	mirror() {

		if ( this.mirrors ) this.mirrors.forEach( u => u.kill() );

		const oldFacing = this.facing;
		const angle1 = this.facing + Math.PI / 2;
		const angle2 = this.facing - Math.PI / 2;
		let pos1 = {
			x: this.x + Math.cos( angle1 ) * MIRROR_SEPARATION,
			y: this.y + Math.sin( angle1 ) * MIRROR_SEPARATION,
		};
		let pos2 = {
			x: this.x + Math.cos( angle2 ) * MIRROR_SEPARATION,
			y: this.y + Math.sin( angle2 ) * MIRROR_SEPARATION,
		};

		if ( game.random() < 0.5 ) {

			const temp = pos1;
			pos1 = pos2;
			pos2 = temp;

		}

		this.action = undefined;

		const layer = game.round.pathingMap.layer( this.x, this.y );

		game.round.pathingMap.withoutEntity( this, () =>
			this.setPosition( getMirroringPosition( pos1, this, layer ) ) );
		this.facing = oldFacing;

		const mirror = new Defender( { x: this.x, y: this.y, owner: this.owner, isMirror: true } );
		const mirrorPos = getMirroringPosition( pos2, mirror, layer );
		mirror.setPosition( mirrorPos );
		mirror.facing = oldFacing;
		game.round.pathingMap.addEntity( mirror );
		this.mirrors = [ mirror ];

	}

}
