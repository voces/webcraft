import type { ImmediateActionProps } from "../../engine/actions/types";
import { currentMazingContest } from "../mazingContestContext";
import type { ReadyEvent } from "../MazingContestNetwork";
import type { Player } from "../players/Player";

export const readyAction = {
	name: "Ready",
	hotkey: "r" as const,
	type: "custom" as const,
	localHandler: ({ player }: ImmediateActionProps<Player>): void => {
		if (player.ready) return;
		currentMazingContest().transmit({ type: "ready" });
	},
	syncHandler: ({ time, connection }: ReadyEvent): void => {
		const mazingContest = currentMazingContest();
		mazingContest.update({ time });

		const player = mazingContest.players.find((p) => p.id === connection);

		if (!player) return;
		if (player.ready) return;

		player.ready = true;

		if (mazingContest.players.every((p) => p.id < 0 || p.ready))
			mazingContest.mainLogic.startRunners();
	},
};
