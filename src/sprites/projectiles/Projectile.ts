import { Sprite, SpriteProps } from "../Sprite.js";
import { tweenPoints } from "../../util/tweenPoints.js";
import { WORLD_TO_GRAPHICS_RATIO } from "../../constants.js";
import { Point } from "../../pathing/PathingMap.js";
import { Player } from "../../players/Player.js";
import { Unit } from "../Unit.js";

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
	producer?: Unit;

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
			x: producer.x,
			y: producer.y,
			...props,
		});

		this.producer = producer;
		this.splash = splash;
		this.damageAmount = damage;
		this.onDamage = onDamage;

		this.speed = speed;
		this.elem.style.borderRadius = "50%";
		this.elem.style.backgroundColor = "transparent";
		this.elem.style.backgroundImage =
			"radial-gradient(rgba(0, 0, 255, 0.25), transparent)";

		const { x, y } = target;

		const path = tweenPoints([
			{ x: this.x, y: this.y },
			{ x, y },
		]);
		const renderPath = tweenPoints([
			{ x: this.x, y: this.y },
			{ x, y },
		]);

		this.activity = {
			render: (delta) => {
				const { x, y } = renderPath.step(delta * (this.speed || 0));
				this.elem.style.left =
					(x - this.radius) * WORLD_TO_GRAPHICS_RATIO + "px";
				this.elem.style.top =
					(y - this.radius) * WORLD_TO_GRAPHICS_RATIO + "px";
			},
			update: (delta) => {
				const point = path.step(delta * (this.speed || 0));
				this.x = point.x;
				this.y = point.y;
				if (path.remaining === 0) {
					this.activity = undefined;

					this.owner
						.getEnemySprites()
						.filter((s) => Number.isFinite(s.health))
						.forEach((target) => {
							const distance = Math.sqrt(
								(target.x - x) ** 2 + (target.y - y) ** 2,
							);
							if (distance > this.splash) return;

							const actualDamage = target.damage(
								this.damageAmount,
							);
							if (this.onDamage)
								this.onDamage(
									target,
									actualDamage,
									producer,
									this,
								);
						});

					this.remove();
				}
			},
			toJSON: () => ({ name: "soar" }),
		};
	}
}
