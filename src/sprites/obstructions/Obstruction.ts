import { Sprite } from "../../sprites/Sprite.js";
import {
	INITIAL_OBSTRUCTION_PROGRESS,
	PATHING_TYPES,
} from "../../constants.js";
import { tweenValues } from "../../util/tweenValues.js";
import { toFootprint } from "./toFootprint.js";
import { ResourceMap } from "../../types.js";
import { Player } from "../../players/Player.js";
import { Unit, UnitProps } from "../Unit.js";
import { Button } from "../spriteLogic.js";
import { game } from "../../index.js";
import { dragSelect } from "../dragSelect.js";
import { network } from "../../network.js";

const destroySelf = {
	name: "Destroy box",
	description: "Destroys selected boxes",
	hotkey: "x" as const,
	type: "custom" as const,
	handler: (): void => {
		// Get currently selected boxes
		const obstructions = dragSelect.selection.filter(
			(s) => s.owner === game.localPlayer && Obstruction.isObstruction,
		);

		// Select the main unit
		const playerCrosser = game.localPlayer.unit;
		if (playerCrosser) dragSelect.setSelection([playerCrosser]);

		// Kill selected obstructions
		network.send({
			type: "kill",
			sprites: obstructions.map((u) => u.id),
		});
	},
};

export type ObstructionProps = UnitProps & {
	buildTime?: number;
	cost?: ResourceMap;
	owner: Player;
};

export abstract class Obstruction extends Unit {
	static defaults = {
		...Unit.defaults,
		buildHotkey: undefined as Button["hotkey"] | undefined,
		buildDescription: undefined as string | undefined,
		cost: { essence: 1 },
		requiresPathing: PATHING_TYPES.WALKABLE | PATHING_TYPES.BUILDABLE,
		speed: 0,
	};

	static isObstruction = (sprite: Sprite): sprite is Obstruction =>
		sprite instanceof Obstruction;

	requiresTilemap = toFootprint(this.radius, this.requiresPathing);
	blocksTilemap = toFootprint(this.radius, this.blocksPathing);
	buildProgress: number;
	buildTime: number;
	owner!: Player;

	private static _buildButton: Button;

	static get buildButton(): Button {
		if (this._buildButton) return this._buildButton;
		this._buildButton = {
			name: this.name,
			hotkey: this.defaults.buildHotkey!,
			description: this.defaults.buildDescription,
			type: "build",
			obstruction: this,
		};

		return this._buildButton;
	}

	constructor({ buildTime = 1, ...props }: ObstructionProps) {
		super({ ...Obstruction.clonedDefaults, ...props });

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

		this.elem.style.borderRadius = "";

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

	get buttons(): Button[] {
		const buttons = super.buttons;
		buttons.push(destroySelf);
		return buttons;
	}
}
