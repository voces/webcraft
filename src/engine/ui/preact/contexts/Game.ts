import { createContext } from "preact";

import type { Game as WCGame } from "../../../../engine/Game";

export type GameType = WCGame & {
	round?: { expireAt: number };
};

// While this can be dangerous, we're going to assume a context has been
// initialized
export const Game = createContext<GameType>((undefined as unknown) as GameType);
