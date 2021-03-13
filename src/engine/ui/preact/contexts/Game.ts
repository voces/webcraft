import { createContext } from "preact";

import type { Game as WCGame } from "../../../../engine/Game";
// eslint-disable-next-line no-restricted-imports
import type { Round } from "../../../../katma/Round";

export type GameType = WCGame & {
	round?: { expireAt: Round["expireAt"] };
};

// While this can be dangerous, we're going to assume a context has been
// initialized
export const Game = createContext<GameType>((undefined as unknown) as GameType);
