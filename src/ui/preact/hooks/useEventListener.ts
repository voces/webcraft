import { useEffect, useRef } from "preact/hooks";
import { Emitter, EventMap } from "../../../core/emitter";

export const useEventListener = <
	Events extends EventMap,
	EventTarget extends Emitter<Events>,
	EventName extends keyof Events
>(
	eventTarget: EventTarget,
	eventName: EventName,
	callback: Events[EventName],
): void => {
	const savedHandler = useRef<Events[EventName]>();

	useEffect(() => {
		savedHandler.current = callback;
	}, [callback]);

	useEffect(() => {
		eventTarget.addEventListener(eventName, savedHandler.current);

		return () =>
			eventTarget.removeEventListener(eventName, savedHandler.current);
	}, [eventName, eventTarget]);
};
