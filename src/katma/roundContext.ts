import { currentKatma } from "./katmaContext";
import type { Round } from "./Round";

// todo: this is unused...
export const currentRound = (): Round => {
	const katma = currentKatma();
	const round = katma.round;
	if (!round) throw new Error("Expected a Round to be in progress");
	return round;
};
