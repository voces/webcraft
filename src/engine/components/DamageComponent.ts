import { Component } from "../../core/Component";
import type { Sprite } from "../entities/widgets/Sprite";
import type { Mutable, NonEmptyArray } from "../types";

export type Weapon = {
	damage: number;
	cooldown: number;
	range: number;
	projectile:
		| "instant"
		| "swing"
		| (<T extends Sprite>(target: Sprite, attacker: T) => void);
	/**
	 * The last time the weapon was used.
	 */
	last: number;
	enabled: boolean;
	onDamage?: (target: Sprite, damage: number, attacker: Sprite) => void;
	damagePoint?: number;
	/**
	 * If `projectile === "swing"`, how much the target can move without
	 * incuring a miss.
	 */
	rangeMotionBuffer?: number;
	swinging?: boolean;
};

export class DamageComponent extends Component<
	[NonEmptyArray<Weapon>, boolean]
> {
	readonly weapons!: NonEmptyArray<Weapon>;
	readonly autoAttack!: boolean;
	initialize(weapons: NonEmptyArray<Weapon>, autoAttack: boolean): void {
		const mutable: Mutable<DamageComponent> = this;
		mutable.weapons = weapons;
		mutable.autoAttack = autoAttack;
	}
}
