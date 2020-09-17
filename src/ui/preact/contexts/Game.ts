import { createContext } from "preact";
import { App } from "../../../core/App";
import { Emitter } from "../../../core/emitter";
import { Game as WCGame, GameEvents } from "../../../engine/Game";
import { Round } from "../../../katma/Round";

type GameType = Emitter<GameEvents> &
	App & {
		addNetworkListener: WCGame["addNetworkListener"];
		connect: WCGame["connect"];
		localPlayer?: WCGame["localPlayer"];
		removeNetworkListener: WCGame["removeNetworkListener"];
		round?: { expireAt: Round["expireAt"] };
	};

// While this can be dangerous, we're going to assume a context as always been
// initialized
export const Game = createContext<GameType>((undefined as unknown) as GameType);
