import { currentApp, withApp, wrapApp } from "../core/appContext";
import type { Game } from "./Game";
import { isGame } from "./typeguards";

export const withGame = <T>(game: Game, fn: (game: Game) => T): T =>
	withApp(game, fn);

export const wrapGame = <Args extends unknown[], Return extends unknown>(
	game: Game,
	fn: (...args: Args) => Return,
): ((...args: Args) => Return) => wrapApp(game, fn);

export const currentGame = (): Game => {
	const app = currentApp();
	if (!isGame(app)) throw new Error("Expected a Game context");
	return app;
};
