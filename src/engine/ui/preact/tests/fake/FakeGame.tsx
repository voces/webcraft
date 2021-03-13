import { emitter } from "../../../../../core/emitter";
import type { Game as WCGame } from "../../../../../engine/Game";
import type { Network } from "../../../../../engine/Network";

export const fakeGame = (props?: { network: Network }): WCGame => {
	const network =
		props?.network ??
		emitter(({
			connect: jest.fn(),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any) as Network);

	return (emitter({
		network,
		connect: network.connect.bind(network),
		addNetworkListener: network.addEventListener.bind(network),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	}) as any) as WCGame;
};
