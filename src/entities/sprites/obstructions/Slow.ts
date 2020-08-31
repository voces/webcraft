import { Sprite, Effect } from "../Sprite";
import { Obstruction, ObstructionProps } from "./Obstruction";
import { Unit } from "../Unit";
import { clone } from "../../../util/clone";
import { Projectile } from "../projectiles/Projectile";
import {
	DamageComponentManager,
	DamageComponent,
	Weapon,
} from "../../../components/DamageComponent";

const slowTimeout = (target: Sprite) =>
	target.round.setTimeout(() => {
		const effectIndex = target.effects.findIndex((e) => e.type === "slow");
		const effect = target.effects[effectIndex];

		if (Unit.isUnit(target)) target.speed = effect.oldSpeed;

		target.effects.splice(effectIndex, 1);
	}, 5);

type SlowProps = ObstructionProps & {
	weapon?: Weapon;
	autoAttack?: boolean;
};

export class Slow extends Obstruction {
	static isSlow = (sprite: Sprite): sprite is Slow => sprite instanceof Slow;

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
				if (!Unit.isUnit(target)) return;

				const existingEffect = target.effects.find(
					(e) => e.type === "slow",
				);
				if (existingEffect) {
					target.round.clearTimeout(existingEffect.timeout);
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
				if (!Slow.isSlow(attacker)) return;
				const damageComponent = DamageComponentManager.get(attacker);
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

		DamageComponentManager.set(
			this,
			new DamageComponent(this, [weapon], autoAttack),
		);
	}
}
