import type { ImmediateActionProps } from "./types";

export const cancelAction = {
	name: "Cancel",
	hotkey: "Escape" as const,
	type: "custom" as const,
	localHandler: ({ player }: ImmediateActionProps): void => {
		player.game.obstructionPlacement?.stop();
	},
};
