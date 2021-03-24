import { releaseColor, takeColor } from "../../engine/players/colors";
// eslint-disable-next-line no-restricted-imports
import type { PlayerState as EnginePlayerState } from "../../engine/players/Player";
// eslint-disable-next-line no-restricted-imports
import { Player as EnginePlayer } from "../../engine/players/Player";
import type { MazingContest } from "../MazingContest";
import type { Resource } from "../types";

interface PlayerStateMC extends EnginePlayerState {
	resources: Player["resources"];
}

export class Player extends EnginePlayer<Resource> {
	ready = false;

	toJSON(): PlayerStateMC {
		return {
			...super.toJSON(),
			resources: this.resources,
		};
	}
}
export const patchInState = (
	game: MazingContest,
	playersState: PlayerStateMC[],
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

		player.resources = playerData.resources;
	});
	game.players.sort((a, b) => a.id - b.id);
};
