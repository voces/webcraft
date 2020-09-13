import { Sprite } from "../entities/sprites/Sprite";
import { Component } from "../core/Component";
import { Mutable, NonEmptyArray } from "../types";

export type Weapon = {
	damage: number;
	cooldown: number;
	range: number;
	projectile:
		| "instant"
		| (<T extends Sprite>(target: Sprite, attacker: T) => void);
	last: number;
	enabled: boolean;
	onDamage?: (target: Sprite, damage: number, attacker: Sprite) => void;
};

export class DamageComponent extends Component<
	[NonEmptyArray<Weapon>, boolean]
> {
	readonly weapons!: NonEmptyArray<Weapon>;
	readonly autoAttack!: boolean;
	initialize(weapons: NonEmptyArray<Weapon>, autoAttack: boolean): void {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const that: Mutable<DamageComponent> = this;
		that.weapons = weapons;
		that.autoAttack = autoAttack;
	}
}
