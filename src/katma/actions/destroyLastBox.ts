import type { ImmediateActionProps } from "../../engine/actions/types";
import type { Player } from "../players/Player";
import { isCrosser } from "../typeguards";

export const destroyLastBox = {
	name: "Destroy box",
	description: "Destroys selected or last created box",
	hotkey: "x" as const,
	type: "custom" as const,
	localHandler: ({ player }: ImmediateActionProps<Player>): void => {
		const crosser = player.unit;
		if (!crosser || !isCrosser(crosser)) return;
		const obstructions = [...crosser.obstructions];
		while (obstructions.length) {
			const obstruction = obstructions.pop();
			if (obstruction && obstruction.isAlive) {
				player.game.transmit({
					type: "selfDestruct",
					sprites: [obstruction.id],
				});
				break;
			}
		}
	},
};
