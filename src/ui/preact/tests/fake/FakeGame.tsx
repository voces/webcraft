import { emitter } from "../../../../emitter";
import { Game as WCGame } from "../../../../Game";
import { Network } from "../../../../network";

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
