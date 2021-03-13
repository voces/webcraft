import type { ImmediateActionProps } from "../../engine/actions/types";
import { isObstruction } from "../../engine/typeguards";
import type { Obstruction } from "../entities/obstructions/Obstruction";
import { currentKatma } from "../katmaContext";
import type { SelfDestructEvent } from "../KatmaNetwork";
import type { Player } from "../players/Player";

export const selfDestructAction = {
	name: "Destroy box",
	description: "Destroys selected boxes",
	hotkey: "x" as const,
	type: "custom" as const,
	localHandler: ({ player }: ImmediateActionProps<Player>): void => {
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
		const katma = currentKatma();
		katma.update({ time });

		const player = katma.players.find((p) => p.id === connection);
		if (!player) return;

		player.sprites
			.filter((s) => sprites.includes(s.id))
			.forEach((s) => s.kill());
	},
};
