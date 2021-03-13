import { h, render } from "preact";
import { useState } from "preact/hooks";

import { document } from "../../../core/util/globals";
import type { Game } from "../../Game";
import { Game as GameContext } from "./contexts/Game";
import { Clock } from "./views/Clock";
import { FPS } from "./views/FPS";
import { Login } from "./views/Login";
import { Ping } from "./views/Ping";
import { Resources } from "./views/Resources";
import { TimerWindows } from "./views/TimerWindows";

const App = ({ game }: { game: Game }) => {
	const [loggingIn, setLoggingIn] = useState(true);
	return (
		<GameContext.Provider value={game}>
			<div className="App">
				{loggingIn && <Login onSuccess={() => setLoggingIn(true)} />}
				<div id="top-right" className="h-spacing-8">
					<Resources />
					<TimerWindows />
					<Clock />
					<span id="scores" />
				</div>
				<div id="bottom-left" className="h-spacing-8">
					<Ping />
					<FPS />
				</div>
			</div>
		</GameContext.Provider>
	);
};

export const initialize = (game: Game): void => {
	render(<App game={game} />, document.getElementById("preact")!);
};
