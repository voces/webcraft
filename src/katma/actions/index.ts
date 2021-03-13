import { currentKatma } from "../katmaContext";
import { selfDestructAction } from "./selfDestruct";

export const registerNetworkedActionListeners = (): void => {
	const katma = currentKatma();
	katma.addNetworkListener("selfDestruct", selfDestructAction.syncHandler);
};
