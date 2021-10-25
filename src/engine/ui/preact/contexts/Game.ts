import { createContext } from "preact";

import type { Game as WCGame } from "../../../../engine/Game";

// While this can be dangerous, we're going to assume a context has been
// initialized
export const Game = createContext<WCGame>(undefined as unknown as WCGame);
