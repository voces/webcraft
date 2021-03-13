import { isSprite } from "../typeguards";
import type { ImmediateActionProps } from "./types";

export const centerAction = {
	name: "Center",
	hotkey: " " as const,
	type: "custom" as const,
	localHandler: ({ player }: ImmediateActionProps): void => {
		const selectionSystem = player.game.selectionSystem;
		const selection = selectionSystem.selection;

		if (selection.length === 0 && player.sprites.length)
			return selectionSystem.setSelection([player.sprites[0]]);

		const { xSum, ySum } = selection.filter(isSprite).reduce(
			({ xSum, ySum }, { position: { x, y } }) => ({
				xSum: xSum + x,
				ySum: ySum + y,
			}),
			{ xSum: 0, ySum: 0 },
		);
		const x = xSum / selection.length;
		const y = ySum / selection.length;
		player.game.graphics.panTo({ x, y });
	},
};
