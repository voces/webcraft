import { Sprite } from "../entities/sprites/Sprite";
import { DeprecatedComponent } from "../core/Component";
import { DeprecatedComponentManager } from "../core/DeprecatedComponentManager";
import { NonEmptyArray } from "../types";

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

export class DamageComponent extends DeprecatedComponent {
	weapons: NonEmptyArray<Weapon>;
	autoAttack: boolean;

	constructor(
		entity: Sprite,
		weapons: NonEmptyArray<Weapon>,
		autoAttack: boolean,
	) {
		super(entity);
		this.weapons = weapons;
		this.autoAttack = autoAttack;
	}
}

export const DamageComponentManager = new DeprecatedComponentManager<
	DamageComponent
>(DamageComponent);
