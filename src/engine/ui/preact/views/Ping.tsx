import { h, JSX } from "preact";
import { useCallback, useRef } from "preact/hooks";

import { useForceRender } from "../hooks/useForceRender";
import { useGameNetworkListener } from "../hooks/useGameNetworkListener";

type PingSample = {
	eventType: string;
	ping: number;
};

export const Ping = (): JSX.Element => {
	const pings = useRef<PingSample[]>([]).current;
	const forceRender = useForceRender();

	useGameNetworkListener(
		"ping",
		useCallback((ping: PingSample) => {
			pings.push(ping);
			if (pings.length === 6) pings.shift();
			forceRender();
		}, []),
	);

	const median = [...pings].sort((a, b) => a.ping - b.ping)[
		Math.min(2, pings.length - 1)
	];

	const title = [...pings]
		.reverse()
		.map(({ eventType, ping }) => `${eventType}: ${ping.toFixed(1)}ms`)
		.join("\n");

	return (
		median && (
			<span title={title} className="diagnostic">
				{median.ping.toFixed(1)}ms
			</span>
		)
	);
};
