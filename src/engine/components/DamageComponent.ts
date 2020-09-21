import { Component } from "../../core/Component";
import { Sprite } from "../entities/widgets/Sprite";
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
		const mutable: Mutable<DamageComponent> = this;
		mutable.weapons = weapons;
		mutable.autoAttack = autoAttack;
	}
}
