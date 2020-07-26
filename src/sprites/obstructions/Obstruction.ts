import { Sprite } from "../../sprites/Sprite.js";
import {
	INITIAL_OBSTRUCTION_PROGRESS,
	PATHING_TYPES,
} from "../../constants.js";
import { toFootprint } from "./toFootprint.js";
import { ResourceMap } from "../../types.js";
import { Player } from "../../players/Player.js";
import { Unit, UnitProps } from "../Unit.js";
import { Action } from "../spriteLogic.js";
import { dragSelect } from "../dragSelect.js";
import {
	GerminateComponentManager,
	GerminateComponent,
} from "../../components/GerminateComponent.js";

const destroySelf: Action = {
	name: "Destroy box",
	description: "Destroys selected boxes",
	hotkey: "x" as const,
	type: "custom" as const,
	handler: ({ player }): void => {
		// Get currently selected boxes
		const obstructions = dragSelect.selection.filter(
			(s) => s.owner === player && Obstruction.isObstruction,
		);

		// Select the main unit
		const playerCrosser = player.unit;
		if (playerCrosser) dragSelect.setSelection([playerCrosser]);

		// Kill selected obstructions
		player.game.transmit({
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
		graphic: {
			...Unit.defaults.graphic,
			shape: "square" as "square" | "circle",
		},
	};

	static isObstruction = (sprite: Sprite): sprite is Obstruction =>
		sprite instanceof Obstruction;

	requiresTilemap = toFootprint(this.radius, this.requiresPathing);
	blocksTilemap = toFootprint(this.radius, this.blocksPathing);
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
			Math.min(this.maxHealth * INITIAL_OBSTRUCTION_PROGRESS, 1),
		);
		this.buildTime = buildTime;

		GerminateComponentManager.set(this, new GerminateComponent(this));
	}

	get actions(): Action[] {
		const actions = super.actions;
		actions.push(destroySelf);
		return actions;
	}
}
