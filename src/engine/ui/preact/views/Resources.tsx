import type { JSX } from "preact";
import { useContext, useState } from "preact/hooks";

import { Game } from "../contexts/Game";
import { useEventListener } from "../hooks/useEventListener";

export const Resources = (): JSX.Element => {
	const [, setTime] = useState<number>(0);
	const game = useContext(Game);
	useEventListener(game, "update", setTime);

	if (!game.localPlayer) return <></>;

	return (
		<>
			{Object.entries(game.localPlayer.resources)
				.filter(([, value]) => typeof value === "number")
				.map(([key, value]) => (
					<span
						className={`resource ${key}`}
						key={key}
						title={key[0].toUpperCase() + key.slice(1)}
					>
						{game.localPlayer && Math.floor(value ?? 0)}
					</span>
				))}
		</>
	);
};
