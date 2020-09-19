import {
	colors,
	release as releaseColor,
	take as takeColor,
	Color,
} from "./colors";
import { ResourceMap, resourceKeys, Resource } from "../types";
import { Unit } from "../../entities/sprites/Unit";
import { Sprite } from "../../entities/sprites/Sprite";
import { Game } from "../Game";

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
	game: Game;
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

	constructor({ game, ...data }: Partial<Player> & { game: Game }) {
		this.game = game;
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
		if (!this.game.round) return [];
		const isCrosser = this.game.round.crossers.includes(this);
		return isCrosser ? this.game.round.defenders : this.game.round.crossers;
	}

	isEnemy(player: Player): boolean {
		if (!this.game.round) throw new Error("round not active!");
		const selfIsCrosser = this.game.round.crossers.includes(this);
		const otherIsCrosser = this.game.round.crossers.includes(player);
		return selfIsCrosser !== otherIsCrosser;
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

export const patchInState = (game: Game, playersState: PlayerState[]): void => {
	playersState.forEach(({ color, id, ...playerData }) => {
		const player =
			game.players.find((p) => p.id === id) ||
			new Player({ ...playerData, id, game });

		if (
			color !== undefined &&
			(!player.color || player.color.index !== color)
		) {
			if (player.color) releaseColor(player.color);
			player.color = takeColor(color);
		}

		player.score = playerData.score;
	});
	game.players.sort((a, b) => a.id - b.id);
};