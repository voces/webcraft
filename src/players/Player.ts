import {
	colors,
	release as releaseColor,
	take as takeColor,
	Color,
} from "./colors.js";
import { game } from "../index.js";
import { ResourceMap, resourceKeys, Resource } from "../types.js";
import { Unit } from "../sprites/Unit.js";
import { Sprite } from "../sprites/Sprite.js";

export interface PlayerState {
	color: number | undefined;
	id: number;
	username: string;
	score: {
		bulldog: number;
	};
	crosserPlays: number;
}

export class Player {
	score = {
		bulldog: 1000,
	};
	sprites: Array<Sprite> = [];
	isHere = true;
	crosserPlays = 0;
	resources = { essence: 0 };
	username = "tim";
	id = -1;
	color?: Color;
	unit?: Unit;

	constructor(data: Partial<Player>) {
		Object.assign(this, data);

		if (!data.username || parseInt(data.username) === data.id)
			Object.defineProperty(this, "username", {
				get: () => (this.color ? this.color.name : this.id),
			});

		// placeholder player (solo)
		if (data.id !== -1) game.players.push(this);
	}

	checkResources(resources: ResourceMap): Resource[] {
		const low: Resource[] = [];
		for (const resource of resourceKeys)
			if (this.resources[resource] < resources[resource])
				low.push(resource);

		return low;
	}

	subtractResources(resources: ResourceMap): void {
		for (const resource of resourceKeys)
			this.resources[resource] -= resources[resource];
	}

	get enemies(): Player[] {
		if (!game.round) return [];
		const isCrosser = game.round.crossers.includes(this);
		return isCrosser ? game.round.defenders : game.round.crossers;
	}

	getEnemySprites(): Sprite[] {
		return this.enemies.map((p) => p.sprites).flat();
	}

	toJSON(): PlayerState {
		return {
			color: this.color ? colors.indexOf(this.color) : undefined,
			id: this.id,
			username: this.username,
			score: this.score,
			crosserPlays: this.crosserPlays,
		};
	}
}

export const patchInState = (playersState: PlayerState[]): void => {
	playersState.forEach(({ color, id, ...playerData }) => {
		const player =
			game.players.find((p) => p.id === id) ||
			new Player({ ...playerData, id });

		if (color && (!player.color || player.color.index !== color)) {
			if (player.color) releaseColor(player.color);
			player.color = takeColor(color);
		}

		player.score = playerData.score;
	});
	game.players.sort((a, b) => a.id - b.id);
};
