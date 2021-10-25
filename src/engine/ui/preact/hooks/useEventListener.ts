import { useEffect } from "preact/hooks";

import type { Emitter, EventMap } from "../../../../core/emitter";

export const useEventListener = <
	Events extends EventMap,
	EventTarget extends Emitter<Events>,
	EventName extends keyof Events,
>(
	eventTarget: EventTarget,
	eventName: EventName,
	callback: Events[EventName],
): void => {
	useEffect(() => {
		eventTarget.addEventListener(eventName, callback);

		return () => eventTarget.removeEventListener(eventName, callback);
	}, [eventName, eventTarget]);
};
