import { MIRROR_SEPARATION } from "../constants.js";
import { Unit, UnitProps } from "./Unit.js";
import { Sprite } from "./Sprite.js";
import { Point } from "../pathing/PathingMap.js";
import { dragSelect } from "./dragSelect.js";
import { Action } from "./spriteLogic.js";
import { context } from "../superContext.js";

const mirror = {
	name: "Mirror Image",
	hotkey: "r" as const,
	type: "custom" as const,
	handler: (): void => {
		const game = context.game;
		const ownUnits = dragSelect.selection.filter(
			(u) => u.owner === game.localPlayer && Unit.isUnit(u),
		);
		const realDefenders = ownUnits.filter(
			(u) => Unit.isUnit(u) && !u.isIllusion,
		);
		if (realDefenders.length)
			game.transmit({
				type: "mirror",
				sprites: realDefenders.map((u) => u.id),
			});
	},
};

const getMirroringPosition = (pos: Point, entity: Sprite, layer?: number) => {
	if (!context.game.round)
		throw new Error("called getMirroringPosition outsied a round");

	const nearest = context.game.round.pathingMap.nearestSpiralPathing(
		pos.x,
		pos.y,
		entity,
	);

	if (context.game.round.pathingMap.layer(nearest.x, nearest.y) === layer)
		return nearest;

	return context.game.round.pathingMap.nearestSpiralPathing(
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
			range: 0.5,
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
			x: this.x + Math.cos(angle1) * MIRROR_SEPARATION,
			y: this.y + Math.sin(angle1) * MIRROR_SEPARATION,
		};
		let pos2 = {
			x: this.x + Math.cos(angle2) * MIRROR_SEPARATION,
			y: this.y + Math.sin(angle2) * MIRROR_SEPARATION,
		};

		if (context.game.random() < 0.5) {
			const temp = pos1;
			pos1 = pos2;
			pos2 = temp;
		}

		this.activity = undefined;

		const layer = this.round.pathingMap.layer(this.x, this.y);

		this.round.pathingMap.withoutEntity(this, () =>
			this.setPosition(getMirroringPosition(pos1, this, layer)),
		);
		this.facing = oldFacing;

		const mirror = new Defender({
			x: this.x,
			y: this.y,
			owner: this.owner,
			isIllusion: true,
		});
		const mirrorPos = getMirroringPosition(pos2, mirror, layer);
		mirror.setPosition(mirrorPos);
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
