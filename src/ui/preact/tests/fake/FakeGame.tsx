import { emitter } from "../../../../emitter";
import { Game as WCGame } from "../../../../Game";
import { Network } from "../../../../network";

export const fakeGame = (props?: { network: Network }): WCGame => {
	const network = props?.network ?? emitter({});
	const game = emitter({
		network,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		addNetworkListener: (...args: [any, any]) =>
			network.addEventListener(...args),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	}) as any;
	return game;
};
