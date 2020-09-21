import { Color } from "three";

import { cancelAction } from "../../../actions/cancel";
import { holdPositionAction } from "../../../actions/holdPosition";
import { stopAction } from "../../../actions/stop";
import { Action } from "../../../actions/types";
import { isInAttackRange } from "../../../api/UnitApi";
import { AttackTarget } from "../../../components/AttackTarget";
import { BuildTarget } from "../../../components/BuildTarget";
import { DamageComponent, Weapon } from "../../../components/DamageComponent";
import { HoldPositionComponent } from "../../../components/HoldPositionComponent";
import { MoveTarget } from "../../../components/MoveTarget";
import { BUILD_DISTANCE } from "../../../constants";
import { currentGame } from "../../../gameContext";
import { Point } from "../../../pathing/PathingMap";
import { Player } from "../../../players/Player";
import { Sprite, SpriteProps } from "../Sprite";
import { Obstruction } from "./units/Obstruction";

class NoWeaponError extends Error {
	message = "No weapon";
}
class TargetTooFarError extends Error {
	message = "Target too far";
}

export type UnitProps = SpriteProps & {
	isIllusion?: boolean;
	owner: Player;
	speed?: number;
	weapon?: Weapon;
	autoAttack?: boolean;
	name?: string;
	builds?: typeof Obstruction[];
};

const revealIllusion = (owner: Player) => {
	const game = currentGame();
	return game.alliances.isAlly(owner, game.localPlayer);
};

const darkBlue = new Color("#191966");

// `Seeing Class extends value undefined is not a constructor or null`? Import
// Player before Sprite.
class Unit extends Sprite {
	static defaults = {
		...Sprite.clonedDefaults,
		isIllusion: false,
		// 380 in WC3
		speed: 5.938,
		autoAttack: false,
	};

	readonly isUnit = true;
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
		meshBuilder,
		...props
	}: UnitProps) {
		super({
			...props,
			meshBuilder: {
				...Unit.defaults.meshBuilder,
				...meshBuilder,
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
		const damageComponent = this.get(DamageComponent)[0];

		// We can't attack without a weapon
		if (!damageComponent) throw new NoWeaponError();

		BuildTarget.clear(this);
		HoldPositionComponent.clear(this);

		// Attacker can't move and target is not in range; do nothing
		if (!this.speed && !isInAttackRange(this, target))
			throw new TargetTooFarError();

		new AttackTarget(this, target);
		new MoveTarget({
			entity: this,
			target,
			distance:
				this.collisionRadius +
				damageComponent.weapons[0].range +
				target.collisionRadius -
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
		if (buildList.length > 0) buildList.push(cancelAction);

		const actions: Action[] = buildList;

		if (this.speed > 0) actions.push(holdPositionAction, stopAction);

		return actions;
	}

	toJSON(): ReturnType<typeof Sprite.prototype.toJSON> {
		return {
			...super.toJSON(),
		};
	}
}

export { Unit };
