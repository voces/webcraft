import { h, render } from "preact";
import { Login } from "./views/Login";
import { document } from "../../util/globals";
import { Game } from "../../Game";
import { Game as GameContext } from "./contexts/Game";
import { Clock } from "./views/Clock";
import { Essense } from "./views/Essence";
import { Ping } from "./views/Ping";

const App = ({ game }: { game: Game }) => (
	<GameContext.Provider value={game}>
		<div className="App">
			<Login />
			<div id="top-right" className="h-spacing-8">
				<Essense />
				<Clock />
				<span id="scores"></span>
			</div>
			<div id="bottom-left" className="h-spacing-8">
				<Ping />
			</div>
		</div>
	</GameContext.Provider>
);

export const initialize = (game: Game): void => {
	render(<App game={game} />, document.getElementById("preact")!);
};
