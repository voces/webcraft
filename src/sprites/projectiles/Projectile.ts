import { Sprite, SpriteProps } from "../Sprite.js";
import { Point } from "../../pathing/PathingMap.js";
import { Player } from "../../players/Player.js";
import { Unit } from "../Unit.js";
import { MoveTargetManager, MoveTarget } from "../../components/MoveTarget.js";

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
	static defaults = {
		...Sprite.defaults,
		radius: 3,
		speed: 4,
		splash: 2.5,
		maxHealth: Infinity,
		selectable: false,
		blocksPathing: 0,
		requiresPathing: 0,
		graphic: {
			...Sprite.defaults.graphic,
			color: "transparent",
			texture: "radial-gradient(rgba(0, 0, 255, 0.25), transparent)",
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
			game: props.owner.game,
			x: producer.position.x,
			y: producer.position.y,
			...props,
		});

		this.producer = producer;
		this.splash = splash;
		this.damageAmount = damage;
		this.onDamage = onDamage;
		this.speed = speed;

		MoveTargetManager.set(this, new MoveTarget({ entity: this, target }));
	}
}
