import { Sprite, SpriteProps } from "../Sprite.js";
import {
	INITIAL_OBSTRUCTION_PROGRESS,
	PATHING_TYPES,
} from "../../constants.js";
import { tweenValues } from "../../util/tweenValues.js";
import { toFootprint } from "./toFootprint.js";
import { ResourceMap } from "../../types.js";
import { Player } from "../../players/Player.js";

export type ObstructionProps = SpriteProps & {
	buildTime?: number;
	cost?: ResourceMap;
	owner: Player;
};

export abstract class Obstruction extends Sprite {
	static defaults = {
		...Sprite.defaults,
		cost: { essence: 1 },
		requiresPathing: PATHING_TYPES.WALKABLE | PATHING_TYPES.BUILDABLE,
	};

	static isObstruction = (
		sprite: Obstruction | Sprite,
	): sprite is Obstruction => sprite instanceof Obstruction;

	requiresTilemap = toFootprint(this.radius, this.requiresPathing);
	blocksTilemap = toFootprint(this.radius, this.blocksPathing);
	buildProgress: number;
	buildTime: number;
	owner!: Player;

	constructor({ buildTime = 1, ...props }: ObstructionProps) {
		super(props);

		this.health = Math.round(
			Math.max(this.maxHealth * INITIAL_OBSTRUCTION_PROGRESS, 1),
		);
		this.buildProgress = INITIAL_OBSTRUCTION_PROGRESS;
		this.buildTime = buildTime;

		const start = this.round.lastUpdate;
		let lastHealth = this.health;
		const tween = tweenValues(this.health, this.maxHealth);

		let renderProgress = INITIAL_OBSTRUCTION_PROGRESS;
		let renderedHealth = lastHealth;
		let lastRenderedHealth = lastHealth;

		this.action = {
			update: (delta) => {
				renderProgress = this.buildProgress = Math.min(
					this.buildProgress + delta / this.buildTime,
					1,
				);
				const newHealth = tween(this.buildProgress);
				const deltaHealth = Math.round(newHealth - lastHealth);
				this.health += deltaHealth;
				renderedHealth = this.health;
				lastHealth += deltaHealth;
				lastRenderedHealth = lastHealth;

				if (this.round.lastUpdate >= start + this.buildTime)
					this.action = undefined;
			},
			render: (delta) => {
				renderProgress = Math.min(
					renderProgress + delta / this.buildTime,
					1,
				);
				const newHealth = tween(renderProgress);
				const deltaHealth = Math.round(newHealth - lastRenderedHealth);
				renderedHealth += deltaHealth;
				lastRenderedHealth += deltaHealth;

				this.elem.style.opacity = (
					renderedHealth / this.maxHealth
				).toString();
			},
			toJSON: () => ({
				name: "construct",
				buildProgress: this.buildProgress,
				lastHealth,
			}),
		};
	}
}
