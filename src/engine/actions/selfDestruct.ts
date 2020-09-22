import { Obstruction } from "../entities/widgets/sprites/units/Obstruction";
import { currentGame } from "../gameContext";
import { SelfDestructEvent } from "../Network";
import { isObstruction } from "../typeguards";
import { ImmediateActionProps } from "./types";

export const selfDestructAction = {
	name: "Destroy box",
	description: "Destroys selected boxes",
	hotkey: "x" as const,
	type: "custom" as const,
	localHandler: ({ player }: ImmediateActionProps): void => {
		// Get currently selected boxes
		const obstructions = player.game.selectionSystem.selection.filter(
			(s): s is Obstruction => isObstruction(s) && s.owner === player,
		);

		// Select the main unit
		const mainUnit = player.unit;
		if (mainUnit) player.game.selectionSystem.setSelection([mainUnit]);

		// Kill selected obstructions
		player.game.transmit({
			type: "selfDestruct",
			sprites: obstructions.map((u) => u.id),
		});
	},
	syncHandler: ({ time, sprites, connection }: SelfDestructEvent): void => {
		const game = currentGame();
		game.update({ time });

		const player = game.players.find((p) => p.id === connection);
		if (!player) return;

		player.sprites
			.filter((s) => sprites.includes(s.id))
			.forEach((s) => s.kill());
	},
};
