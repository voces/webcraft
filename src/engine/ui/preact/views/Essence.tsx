import { h, JSX } from "preact";
import { useContext, useState } from "preact/hooks";

import { Game } from "../contexts/Game";
import { useEventListener } from "../hooks/useEventListener";

export const Essense = (): JSX.Element => {
	const [, setTime] = useState<number>(0);
	const game = useContext(Game);
	useEventListener(game, "update", setTime);

	return (
		<span title="Essense">
			{game.localPlayer && Math.floor(game.localPlayer.resources.essence)}
		</span>
	);
};
