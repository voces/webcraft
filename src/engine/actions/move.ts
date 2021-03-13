import type { Unit } from "../entities/widgets/sprites/Unit";
import { currentGame } from "../gameContext";
import type { MoveEvent } from "../Network";
import { isUnit } from "../typeguards";
import type { PointActionProps } from "./types";

export const moveAction = {
	name: "Move",
	hotkey: "m" as const,
	type: "point" as const,
	localHandler: ({ point }: PointActionProps): void => {
		const game = currentGame();

		const units = game.selectionSystem.selection.filter(
			(s): s is Unit =>
				isUnit(s) && s.owner === game.localPlayer && s.speed > 0,
		);

		if (units.length)
			game.transmit({
				type: "move",
				sprites: units.map((u) => u.id),
				...point,
			});
	},
	syncHandler: ({ time, connection, sprites, x, y }: MoveEvent): void => {
		const game = currentGame();
		game.update({ time });

		const player = game.players.find((p) => p.id === connection);
		if (!player) return;

		player.sprites
			.filter((s) => sprites.includes(s.id))
			.filter(isUnit)
			.forEach((s) => s.walkTo({ x, y }));
	},
};
