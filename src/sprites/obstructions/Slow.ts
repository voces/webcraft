import { Sprite, Effect } from "../Sprite.js";
import { Obstruction, ObstructionProps } from "./Obstruction.js";
import { Unit, Weapon } from "../Unit.js";
import { clone } from "../../util/clone.js";
import { Projectile } from "../projectiles/Projectile.js";

const slowTimeout = (target: Sprite) =>
	target.round.setTimeout(() => {
		const effectIndex = target.effects.findIndex((e) => e.type === "slow");
		const effect = target.effects[effectIndex];

		if (Unit.isUnit(target)) target.speed = effect.oldSpeed;
		target.elem.style.backgroundImage = effect.oldBackgroundImage;
		target.effects.splice(effectIndex, 1);
	}, 5);

type SlowProps = ObstructionProps & {
	weapon?: Weapon;
	autoAttack?: boolean;
};

export class Slow extends Obstruction {
	static isSlow = (sprite: Slow | Sprite): sprite is Slow =>
		sprite instanceof Slow;

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

				const effect: Effect = {
					type: "slow",
					oldSpeed: target.speed,
					oldBackgroundImage: target.elem.style.backgroundImage,
					timeout: slowTimeout(target),
				};

				target.speed = target.speed * 0.6;
				target.elem.style.backgroundImage +=
					" radial-gradient(rgba(0, 0, 255, 0.25), rgba(0, 0, 255, 0.25))";

				target.effects.push(effect);
			},
			projectile: (target: Sprite, attacker: Sprite): void => {
				if (!Slow.isSlow(attacker)) return;

				new Projectile({
					target,
					producer: attacker,
					owner: attacker.owner,
					damage: attacker.weapon.damage,
					onDamage: attacker.weapon.onDamage,
				});
			},
		},
	};

	autoAttack: boolean;

	weapon: Weapon;

	constructor({
		weapon = clone(Slow.defaults.weapon),
		autoAttack = Slow.defaults.autoAttack,
		...props
	}: SlowProps) {
		super({ ...Slow.clonedDefaults, ...props });

		this.weapon = weapon;
		this.autoAttack = autoAttack;
	}
}
