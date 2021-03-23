import { currentMazingContest } from "../mazingContestContext";
import { selfDestructAction } from "./selfDestruct";

export const registerNetworkedActionListeners = (): void => {
	const MazingContest = currentMazingContest();
	MazingContest.addNetworkListener(
		"selfDestruct",
		selfDestructAction.syncHandler,
	);
};
