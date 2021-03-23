import type { ImmediateActionProps } from "../../engine/actions/types";
import type { Player } from "../players/Player";

export const destroyLast = {
	name: "Destroy last",
	description: "Destroys last created obstruction",
	hotkey: "x" as const,
	type: "custom" as const,
	localHandler: ({ player }: ImmediateActionProps<Player>): void => {
		const unit = player.getPrimarySelectedUnit();
		if (!unit) return;
		const obstructions = [...unit.obstructions];
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
