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
import { Action } from "../spriteLogic.js";
import { dragSelect } from "../dragSelect.js";
import { context } from "../../superContext.js";

const destroySelf = {
	name: "Destroy box",
	description: "Destroys selected boxes",
	hotkey: "x" as const,
	type: "custom" as const,
	handler: (): void => {
		// Get currently selected boxes
		const game = context.game;
		const obstructions = dragSelect.selection.filter(
			(s) => s.owner === game.localPlayer && Obstruction.isObstruction,
		);

		// Select the main unit
		const playerCrosser = game.localPlayer.unit;
		if (playerCrosser) dragSelect.setSelection([playerCrosser]);

		// Kill selected obstructions
		game.transmit({
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
		buildHotkey: undefined as Action["hotkey"] | undefined,
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

	private static _buildAction: Action;

	static get buildAction(): Action {
		if (this._buildAction) return this._buildAction;
		this._buildAction = {
			name: this.name,
			hotkey: this.defaults.buildHotkey!,
			description: this.defaults.buildDescription,
			type: "build",
			obstruction: this,
		};

		return this._buildAction;
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

		this.activity = {
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
					this.activity = undefined;
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

	get actions(): Action[] {
		const actions = super.actions;
		actions.push(destroySelf);
		return actions;
	}
}
