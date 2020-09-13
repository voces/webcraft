import { createContext } from "preact";
import { Game as WCGame } from "../../../Game";

// While this can be dangerous, we're going to assume a context as always been
// initialized
export const Game = createContext<WCGame>((undefined as unknown) as WCGame);
