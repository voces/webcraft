import { useContext, useEffect, useRef } from "preact/hooks";

import type { NetworkEventCallback } from "../../../../engine/Network";
import { Game } from "../contexts/Game";

export const useGameNetworkListener = <
	EventName extends keyof NetworkEventCallback
>(
	eventName: EventName,
	callback: NetworkEventCallback[EventName],
): void => {
	const game = useContext(Game);
	const savedHandler = useRef<NetworkEventCallback[EventName]>();

	useEffect(() => {
		savedHandler.current = callback;
	}, [callback]);

	useEffect(() => {
		game.addNetworkListener(eventName, savedHandler.current);

		return () =>
			game.removeNetworkListener(eventName, savedHandler.current);
	}, [eventName, callback, game]);
};
