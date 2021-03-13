import type { Entity } from "../../core/Entity";
import type { Sprite } from "../entities/widgets/Sprite";
import type { Unit } from "../entities/widgets/sprites/Unit";
import type { Game } from "../Game";
import { currentGame } from "../gameContext";
import { isUnit } from "../typeguards";
import type { Color } from "./colors";
import { colors, releaseColor, takeColor } from "./colors";

export interface PlayerState {
	color: number | undefined;
	id: number;
	username: string;
}
export class Player<Resource extends string = string> {
	game: Game;
	sprites: Array<Sprite> = [];
	isHere = true;
	resources: Partial<Record<Resource, number>> = {};
	username = "tim";
	id = -1;
	color?: Color;

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

	checkResources(resources: Record<Resource, number>): Resource[] {
		const low: Resource[] = [];
		for (const resource in resources)
			if ((this.resources[resource] ?? 0) < resources[resource])
				low.push(resource);

		return low;
	}

	subtractResources(resources: Record<Resource, number>): void {
		for (const resource in resources)
			this.resources[resource] =
				(this.resources[resource] ?? 0) - resources[resource];
	}

	get enemies(): Player[] {
		const game = currentGame();
		return game.players.filter((p) => game.alliances.isEnemy(this, p));
	}

	isEnemy(player: Player): boolean {
		return currentGame().alliances.isEnemy(this, player);
	}

	getEnemySprites(): Sprite[] {
		return this.enemies
			.map((p) => p.sprites.filter((s) => s.isAlive))
			.flat();
	}

	get uid(): string {
		return `${this.username}#${this.id}`;
	}

	// TODO: Remove off Player and make a helper
	getPrimarySelectedUnit(entities?: ReadonlyArray<Entity>): Unit | undefined {
		const universe = entities ?? this.game.selectionSystem.selection;
		const units = universe.filter(isUnit).filter((u) => u.owner === this);
		if (!units.length) return;

		let activeUnit = units[0];
		for (let i = 1; i < units.length; i++)
			if (units[i].priority > activeUnit.priority) activeUnit = units[i];

		return units[0];
	}

	toJSON(): PlayerState {
		return {
			color: this.color ? colors.indexOf(this.color) : undefined,
			id: this.id,
			username: this.username,
		};
	}
}

export const patchInState = (game: Game, playersState: PlayerState[]): void => {
	playersState.forEach(({ color, id, ...playerData }) => {
		const player =
			game.players.find((p) => p.id === id) ??
			new Player({ ...playerData, id, game });

		if (
			color !== undefined &&
			(!player.color || player.color.index !== color)
		) {
			if (player.color) releaseColor(player.color);
			player.color = takeColor(color);
		}
	});
	game.players.sort((a, b) => a.id - b.id);
};
