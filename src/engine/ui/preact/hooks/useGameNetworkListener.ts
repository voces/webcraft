import { useContext, useEffect } from "preact/hooks";

import type { NetworkEventCallback } from "../../../../engine/Network";
import { Game } from "../contexts/Game";

export const useGameNetworkListener = <
	EventName extends keyof NetworkEventCallback,
>(
	eventName: EventName,
	callback: NetworkEventCallback[EventName],
): void => {
	const game = useContext(Game);

	useEffect(() => {
		game.addNetworkListener(eventName, callback);

		return () => game.removeNetworkListener(eventName, callback);
	}, [eventName, callback, game]);
};
