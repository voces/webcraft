import type { Unit } from "../entities/widgets/sprites/Unit";
import { currentGame } from "../gameContext";
import type { StopEvent } from "../Network";
import { isUnit } from "../typeguards";
import type { ImmediateActionProps } from "./types";

export const stopAction = {
	name: "Stop",
	hotkey: "s" as const,
	type: "custom" as const,
	localHandler: ({ player }: ImmediateActionProps): void => {
		const ownedUnits = player.game.selectionSystem.selection.filter(
			(u): u is Unit => isUnit(u) && u.owner === player,
		);

		if (ownedUnits.length > 0)
			player.game.transmit({
				type: "stop",
				sprites: ownedUnits.map((u) => u.id),
			});
	},
	syncHandler: ({ time, connection, sprites }: StopEvent): void => {
		const game = currentGame();
		game.update({ time });

		const player = game.players.find((p) => p.id === connection);
		if (!player) return;

		player.sprites
			.filter((s) => sprites.includes(s.id))
			.filter(isUnit)
			.forEach((s) => s.stop());
	},
};
