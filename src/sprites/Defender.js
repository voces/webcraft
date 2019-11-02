
import { MIRROR_SEPARATION } from "../constants.js";
import Unit from "./Unit.js";
import game from "../index.js";
import attack from "./actions/attack.js";

const getMirroringPosition = ( pos, entity, layer ) => {

	const nearest = game.round.pathingMap.nearestSpiralPathing( pos.x, pos.y, entity );

	if ( game.round.pathingMap.layer( nearest.x, nearest.y ) === layer )
		return nearest;

	return game.round.pathingMap.nearestSpiralPathing( nearest.x, nearest.y, entity, layer );

};

export default class Defender extends Unit {

	static radius = 1;
	static maxHealth = Number.MAX_VALUE;

	// 420 in WC3 on fast
	speed = 6.5625;
	weapon = {
		...this.weapon,
		damage: 50,
	}

	autoAttack = true;

	attack( target ) {

		attack( this, target );

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
