import { currentMazingContest } from "../mazingContestContext";

export const readyAction = {
	name: "Ready",
	hotkey: "r" as const,
	type: "custom" as const,
	localHandler: (): void => {
		currentMazingContest().transmit({ type: "ready" });
	},
	syncHandler: (): void => {
		currentMazingContest().dispatchEvent("ready");
	},
};
