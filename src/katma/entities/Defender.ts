import { mirrorAction } from "../../engine/actions/mirror";
import { Action } from "../../engine/actions/types";
import { Unit, UnitProps } from "../../engine/entities/widgets/sprites/Unit";

type DefenderProps = UnitProps & {
	autoAttack?: boolean;
};

export class Defender extends Unit {
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

	readonly isDefender = true;
	autoAttack: boolean;

	constructor({
		autoAttack = Defender.defaults.autoAttack,
		...props
	}: DefenderProps) {
		super({ ...Defender.clonedDefaults, ...props });
		this.autoAttack = autoAttack;
	}

	get actions(): Action[] {
		const actions = super.actions;
		if (!this.isIllusion) actions.push(mirrorAction);
		return actions;
	}
}
