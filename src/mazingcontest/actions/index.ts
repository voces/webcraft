import { currentMazingContest } from "../mazingContestContext";
import { readyAction } from "./ready";
import { selfDestructAction } from "./selfDestruct";

export const registerNetworkedActionListeners = (): void => {
	const MazingContest = currentMazingContest();
	MazingContest.addNetworkListener(
		"selfDestruct",
		selfDestructAction.syncHandler,
	);
	MazingContest.addNetworkListener("ready", readyAction.syncHandler);
};
