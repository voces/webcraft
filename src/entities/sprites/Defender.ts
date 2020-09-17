import { MIRROR_SEPARATION } from "../../engine/constants";
import { Unit, UnitProps } from "./Unit";
import { Sprite } from "./Sprite";
import { Point } from "../../engine/pathing/PathingMap";
import { Action } from "./spriteLogic";

const mirror: Action = {
	name: "Mirror Image",
	hotkey: "r" as const,
	type: "custom" as const,
	handler: ({ player }): void => {
		const ownUnits = player.game.selectionSystem.selection.filter(
			(u): u is Unit => Unit.isUnit(u) && u.owner === player,
		);
		const realDefenders = ownUnits.filter(
			(u) => Unit.isUnit(u) && !u.isIllusion,
		);
		if (realDefenders.length)
			player.game.transmit({
				type: "mirror",
				sprites: realDefenders.map((u) => u.id),
			});
	},
};

const getMirroringPosition = (pos: Point, entity: Sprite, layer?: number) => {
	const nearest = entity.round.pathingMap.nearestSpiralPathing(
		pos.x,
		pos.y,
		entity,
	);

	if (entity.round.pathingMap.layer(nearest.x, nearest.y) === layer)
		return nearest;

	return entity.round.pathingMap.nearestSpiralPathing(
		nearest.x,
		nearest.y,
		entity,
		layer,
	);
};

type DefenderProps = UnitProps & {
	autoAttack?: boolean;
};

export class Defender extends Unit {
	static isDefender = (sprite: Sprite): sprite is Defender =>
		sprite instanceof Defender;

	static defaults = {
		...Unit.defaults,
		maxHealth: Number.MAX_VALUE,
		speed: 6.5625,
		weapon: {
			enabled: true,
			damage: 50,
			cooldown: 1.5,
			// todo: add backswing (time before damage) and recovery (time after damage where the unit can't do anything)
			last: 0,
			range: 0.65,
			projectile: "instant" as const,
		},
		autoAttack: true,
	};

	autoAttack: boolean;

	constructor({
		autoAttack = Defender.defaults.autoAttack,
		...props
	}: DefenderProps) {
		super({ ...Defender.clonedDefaults, ...props });
		this.autoAttack = autoAttack;
	}

	mirror(): void {
		if (this.mirrors) this.mirrors.forEach((u) => u.kill());

		const oldFacing = this.facing;
		const angle1 = this.facing + Math.PI / 2;
		const angle2 = this.facing - Math.PI / 2;
		let pos1 = {
			x: this.position.x + Math.cos(angle1) * MIRROR_SEPARATION,
			y: this.position.y + Math.sin(angle1) * MIRROR_SEPARATION,
		};
		let pos2 = {
			x: this.position.x + Math.cos(angle2) * MIRROR_SEPARATION,
			y: this.position.y + Math.sin(angle2) * MIRROR_SEPARATION,
		};

		if (this.game.random() < 0.5) {
			const temp = pos1;
			pos1 = pos2;
			pos2 = temp;
		}

		const layer = this.round.pathingMap.layer(
			this.position.x,
			this.position.y,
		);

		const realPosition = this.round.pathingMap.withoutEntity(this, () =>
			getMirroringPosition(pos1, this, layer),
		);
		this.position.setXY(realPosition.x, realPosition.y),
			(this.facing = oldFacing);

		const mirror = new Defender({
			x: this.position.x,
			y: this.position.y,
			owner: this.owner,
			isIllusion: true,
		});
		const mirrorPos = getMirroringPosition(pos2, mirror, layer);
		mirror.position.setXY(mirrorPos.x, mirrorPos.y);
		mirror.facing = oldFacing;
		this.round.pathingMap.addEntity(mirror);
		this.mirrors = [mirror];
	}

	get actions(): Action[] {
		const actions = super.actions;
		if (!this.isIllusion) actions.push(mirror);
		return actions;
	}
}
