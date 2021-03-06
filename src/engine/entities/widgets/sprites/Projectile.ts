import { MoveTarget } from "../../../components/MoveTarget";
import type { Point } from "../../../pathing/PathingMap";
import type { Player } from "../../../players/Player";
import type { SpriteProps } from "../Sprite";
import { Sprite } from "../Sprite";
import type { Unit } from "./Unit";

type ProjectileProps = Omit<SpriteProps, "x" | "y" | "game"> & {
	producer: Unit;
	target: Point;
	speed?: number;
	owner: Player;
	splash?: number;
	damage: number;
	onDamage?: (
		target: Sprite,
		damage: number,
		attacker: Unit,
		projectile: Projectile,
	) => void;
	x?: number;
	y?: number;
};

export class Projectile extends Sprite {
	static readonly isProjectile = true;

	static defaults = {
		...Sprite.defaults,
		collisionRadius: 3,
		speed: 4,
		splash: 2.5,
		maxHealth: Infinity,
		selectable: false,
		blocksPathing: 0,
		requiresPathing: 0,
		meshBuilder: {
			...Sprite.defaults.meshBuilder,
			color: "#0000ff",
			opacity: 0.25,
			shadows: false,
		},
	};

	speed: number;
	owner!: Player;
	splash: number;
	damageAmount: number;
	onDamage?: (
		target: Sprite,
		damage: number,
		attacker: Unit,
		projectile: Projectile,
	) => void;
	producer: Unit;

	constructor({
		producer,
		target,
		speed = Projectile.defaults.speed,
		splash = Projectile.defaults.splash,
		damage,
		onDamage,
		...props
	}: ProjectileProps) {
		super({
			...Projectile.clonedDefaults,
			x: producer.position.x,
			y: producer.position.y,
			...props,
		});

		this.producer = producer;
		this.splash = splash;
		this.damageAmount = damage;
		this.onDamage = onDamage;
		this.speed = speed;

		new MoveTarget({ entity: this, target });
	}
}
