import { selfDestructAction } from "../../../../actions/selfDestruct";
import { Action } from "../../../../actions/types";
import { toFootprint } from "../../../../api/toFootprint";
import { GerminateComponent } from "../../../../components/GerminateComponent";
import {
	INITIAL_OBSTRUCTION_PROGRESS,
	PATHING_TYPES,
} from "../../../../constants";
import { Player } from "../../../../players/Player";
import { ResourceMap } from "../../../../types";
import { Unit, UnitProps } from "../Unit";

export type ObstructionProps = UnitProps & {
	buildTime?: number;
	cost?: ResourceMap;
	owner: Player;
};

export class Obstruction extends Unit {
	static defaults = {
		...Unit.defaults,
		buildHotkey: undefined as Action["hotkey"] | undefined,
		buildDescription: undefined as string | undefined,
		cost: { essence: 1 },
		requiresPathing: PATHING_TYPES.WALKABLE | PATHING_TYPES.BUILDABLE,
		speed: 0,
		meshBuilder: {
			...Unit.defaults.meshBuilder,
			shape: "square" as "square" | "circle",
		},
	};

	readonly isObstruction = true;
	requiresTilemap = toFootprint(this.collisionRadius, this.requiresPathing);
	blocksTilemap = toFootprint(this.collisionRadius, this.blocksPathing);
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

		new GerminateComponent(this);
	}

	get actions(): Action[] {
		const actions = super.actions;
		actions.push(selfDestructAction);
		return actions;
	}
}
