import { Emitter } from "../core/emitter";
// eslint-disable-next-line no-restricted-imports
import { InitEvent, Network, StateEvent } from "../engine/Network";
import { Katma } from "./Katma";

type KatmaInitEvent = InitEvent & {
	state: ReturnType<Katma["toJSON"]>;
};

type KatmaStateEvent = StateEvent & {
	state: ReturnType<Katma["toJSON"]>;
};

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function */
const networkEvents = {
	...Network.networkEvents,
	init: (data: KatmaInitEvent) => {},
	state: (data: KatmaStateEvent) => {},
} as const;
/* eslint-enable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function */

export type NetworkEventCallback = typeof networkEvents;

class KatmaNetwork extends Network implements Emitter<NetworkEventCallback> {
	// These are implemented via calling emitter(this)
	addEventListener!: Emitter<NetworkEventCallback>["addEventListener"];
	removeEventListener!: Emitter<NetworkEventCallback>["removeEventListener"];
	removeEventListeners!: Emitter<
		NetworkEventCallback
	>["removeEventListeners"];
	dispatchEvent!: Emitter<NetworkEventCallback>["dispatchEvent"];
}

export { KatmaNetwork };
