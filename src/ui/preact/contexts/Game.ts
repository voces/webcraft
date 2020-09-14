import { createContext } from "preact";
import { App } from "../../../core/App";
import { Emitter } from "../../../emitter";
import { Game as WCGame, GameEvents } from "../../../Game";

type GameType = Emitter<GameEvents> &
	App & {
		addNetworkListener: WCGame["addNetworkListener"];
		removeNetworkListener: WCGame["removeNetworkListener"];
		round?: {
			expireAt: number;
		};
	};

// While this can be dangerous, we're going to assume a context as always been
// initialized
export const Game = createContext<GameType>((undefined as unknown) as GameType);
