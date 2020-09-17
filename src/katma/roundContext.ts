import { currentGame } from "../engine/gameContext";
import { Round } from "./Round";

// todo: this is unused...
export const currentRound = (): Round => {
	const game = currentGame();
	const round = game.round;
	if (!round) throw new Error("Expected a Round to be in progress");
	return round;
};
