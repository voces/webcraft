import type { Unit } from "../../engine/entities/widgets/sprites/Unit";
import { releaseColor, takeColor } from "../../engine/players/colors";
// eslint-disable-next-line no-restricted-imports
import type { PlayerState as EnginePlayerState } from "../../engine/players/Player";
// eslint-disable-next-line no-restricted-imports
import { Player as EnginePlayer } from "../../engine/players/Player";
import type { Katma } from "../Katma";
import type { Resource } from "../types";

export type PlayerState = EnginePlayerState & {
	crosserPlays: number;
	score: { bulldog: number };
};

export class Player extends EnginePlayer<Resource> {
	crosserPlays;
	score: { bulldog: number };
	unit?: Unit;

	constructor(props: Partial<Player> & { game: Katma }) {
		super(props);
		this.crosserPlays ??= 0;
		this.score ??= { bulldog: 1000 };
	}

	toJSON(): PlayerState {
		return {
			...super.toJSON(),
			crosserPlays: this.crosserPlays,
			score: this.score,
		};
	}
}

export const patchInState = (
	game: Katma,
	playersState: PlayerState[],
): void => {
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

		player.score = playerData.score;
	});
	game.players.sort((a, b) => a.id - b.id);
};
