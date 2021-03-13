import type { Unit } from "../entities/widgets/sprites/Unit";
import { currentGame } from "../gameContext";
import type { HoldPositionEvent } from "../Network";
import type { Player } from "../players/Player";
import { isUnit } from "../typeguards";

export const holdPositionAction = {
	name: "Hold Position",
	hotkey: "h" as const,
	type: "custom" as const,
	localHandler: ({ player }: { player: Player }): void => {
		const ownedUnits = player.game.selectionSystem.selection.filter(
			(u): u is Unit => isUnit(u) && u.owner === player && u.speed > 0,
		);

		if (ownedUnits.length > 0)
			player.game.transmit({
				type: "holdPosition",
				sprites: ownedUnits.map((u) => u.id),
			});
	},
	syncHandler: ({ time, connection, sprites }: HoldPositionEvent): void => {
		const game = currentGame();
		game.update({ time });

		const player = game.players.find((p) => p.id === connection);
		if (!player) return;

		player.sprites
			.filter((s) => sprites.includes(s.id))
			.filter(isUnit)
			.forEach((s) => s.holdPosition());
	},
};
