import {
	DamageComponent,
	Weapon,
} from "../../../engine/components/DamageComponent";
import { Effect, Sprite } from "../../../engine/entities/widgets/Sprite";
import { Projectile } from "../../../engine/entities/widgets/sprites/Projectile";
import {
	Obstruction,
	ObstructionProps,
} from "../../../engine/entities/widgets/sprites/units/Obstruction";
import { currentGame } from "../../../engine/gameContext";
import { isUnit } from "../../../engine/typeguards";
import { clone } from "../../../engine/util/clone";
import { isSlow } from "../../typeguards";

const slowTimeout = (target: Sprite) =>
	currentGame().setTimeout(() => {
		const effectIndex = target.effects.findIndex((e) => e.type === "slow");
		const effect = target.effects[effectIndex];

		if (isUnit(target)) target.speed = effect.oldSpeed;

		target.effects.splice(effectIndex, 1);
	}, 5);

type SlowProps = ObstructionProps & {
	weapon?: Weapon;
	autoAttack?: boolean;
};

export class Slow extends Obstruction {
	static readonly isSlow = true;

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
			onDamage: (target: Sprite): void => {
				if (!isUnit(target)) return;

				const existingEffect = target.effects.find(
					(e) => e.type === "slow",
				);
				if (existingEffect) {
					currentGame().clearTimeout(existingEffect.timeout);
					existingEffect.timeout = slowTimeout(target);
					return;
				}

				// todo: add a SlowEffect component?

				const effect: Effect = {
					type: "slow",
					oldSpeed: target.speed,
					timeout: slowTimeout(target),
				};

				target.speed = target.speed * 0.6;

				target.effects.push(effect);
			},
			projectile: (target: Sprite, attacker: Sprite): void => {
				if (!isSlow(attacker)) return;
				const damageComponent = attacker.get(DamageComponent)[0];
				if (!damageComponent) return;

				new Projectile({
					damage: damageComponent.weapons[0].damage,
					onDamage: damageComponent.weapons[0].onDamage,
					owner: attacker.owner,
					producer: attacker,
					target: target.position,
				});
			},
		},
		buildHotkey: "q" as const,
	};

	constructor({
		weapon = clone(Slow.defaults.weapon),
		autoAttack = Slow.defaults.autoAttack,
		...props
	}: SlowProps) {
		super({ ...Slow.clonedDefaults, ...props, weapon, autoAttack });

		new DamageComponent(this, [weapon], autoAttack);
	}
}
