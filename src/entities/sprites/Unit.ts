import { BUILD_DISTANCE } from "../../engine/constants";
import { Sprite, SpriteProps } from "./Sprite";
import { Point } from "../../engine/pathing/PathingMap";
import { Player } from "../../engine/players/Player";
import { Action } from "./spriteLogic";
import { Obstruction } from "./obstructions/index";
import { MoveTarget } from "../../engine/components/MoveTarget";
import { AttackTarget } from "../../engine/components/AttackTarget";
import { isInAttackRange } from "./UnitApi";
import { HoldPositionComponent } from "../../engine/components/HoldPositionComponent";
import { BuildTarget } from "../../engine/components/BuildTarget";
import {
	Weapon,
	DamageComponent,
} from "../../engine/components/DamageComponent";
import { Entity } from "../../core/Entity";
import { Color } from "three";

const holdPosition: Action = {
	name: "Hold Position",
	hotkey: "h" as const,
	type: "custom" as const,
	handler: ({ player }): void => {
		if (!player.game.round) return;

		const ownedUnits = player.game.selectionSystem.selection.filter(
			(u): u is Unit =>
				Unit.isUnit(u) && u.owner === player && u.speed > 0,
		);

		player.game.transmit({
			type: "holdPosition",
			sprites: ownedUnits.map((u) => u.id),
		});
	},
};

const stop: Action = {
	name: "Stop",
	hotkey: "s" as const,
	type: "custom" as const,
	handler: ({ player }): void => {
		if (!player.game.round) return;

		const ownedUnits = player.game.selectionSystem.selection.filter(
			(u): u is Unit => Unit.isUnit(u) && u.owner === player,
		);

		player.game.transmit({
			type: "stop",
			sprites: ownedUnits.map((u) => u.id),
		});
	},
};

const cancel: Action = {
	name: "Cancel",
	hotkey: "Escape" as const,
	type: "custom" as const,
	handler: ({ player }): void => {
		player.game.obstructionPlacement?.stop();
	},
};

class NoWeaponError extends Error {
	message = "No weapon";
}
class TargetTooFarError extends Error {
	message = "Target too far";
}

export type UnitProps = Omit<SpriteProps, "game"> & {
	isIllusion?: boolean;
	owner: Player;
	speed?: number;
	weapon?: Weapon;
	autoAttack?: boolean;
	name?: string;
	builds?: typeof Obstruction[];
};

const revealIllusion = (owner: Player) =>
	!owner.enemies.includes(owner.game.localPlayer);

const darkBlue = new Color("#191966");

// `Seeing Class extends value undefined is not a constructor or null`? Import
// Player before Sprite.
class Unit extends Sprite {
	static isUnit = (entity: Entity): entity is Unit => entity instanceof Unit;

	static defaults = {
		...Sprite.clonedDefaults,
		isIllusion: false,
		// 380 in WC3
		speed: 5.938,
		autoAttack: false,
	};

	isIllusion: boolean;
	mirrors?: Unit[];
	owner!: Player;
	speed: number;
	name: string;
	builds: typeof Obstruction[];
	obstructions: Obstruction[] = [];

	constructor({
		autoAttack = Unit.defaults.autoAttack,
		builds = [],
		isIllusion = Unit.defaults.isIllusion,
		name,
		speed = Unit.defaults.speed,
		weapon,
		graphic,
		...props
	}: UnitProps) {
		super({
			...props,
			graphic: {
				...Unit.defaults.graphic,
				...graphic,
				...(isIllusion && revealIllusion(props.owner)
					? {
							colorFilter: (color: Color): Color =>
								color.lerp(darkBlue, 0.75),
					  }
					: undefined),
			},
		});

		this.isIllusion = isIllusion;
		this.name = name ?? this.constructor.name;
		this.speed = speed;
		this.builds = builds;

		if (weapon) new DamageComponent(this, [weapon], autoAttack);
	}

	attack(target: Sprite): void {
		BuildTarget.clear(this);
		HoldPositionComponent.clear(this);

		const damageComponent = this.get(DamageComponent)[0];

		// We can't attack without a weapon
		if (!damageComponent) throw new NoWeaponError();

		// Attacker can't move and target is not in range; do nothing
		if (!this.speed && !isInAttackRange(this, target))
			throw new TargetTooFarError();

		new AttackTarget(this, target);
		new MoveTarget({
			entity: this,
			target,
			distance:
				this.radius +
				damageComponent.weapons[0].range +
				target.radius -
				1e-7,
		});
	}

	walkTo(target: Point): void {
		this.stop();
		new MoveTarget({ entity: this, target });
	}

	holdPosition(): void {
		this.stop();
		new HoldPositionComponent(this);
	}

	stop(): void {
		MoveTarget.clear(this);
		AttackTarget.clear(this);
		BuildTarget.clear(this);
		HoldPositionComponent.clear(this);
	}

	buildAt(target: Point, ObstructionClass: typeof Obstruction): void {
		this.stop();

		new MoveTarget({
			entity: this,
			target,
			distance: BUILD_DISTANCE - 1e-7,
		});

		new BuildTarget(this, ObstructionClass, target);
	}

	get actions(): Action[] {
		const buildList = this.builds.map((klass) => klass.buildAction);
		if (buildList.length > 0) buildList.push(cancel);

		const actions: Action[] = buildList;

		if (this.speed > 0) actions.push(holdPosition, stop);

		return actions;
	}

	toJSON(): ReturnType<typeof Sprite.prototype.toJSON> {
		return {
			...super.toJSON(),
		};
	}
}

export { Unit };
