import { Context } from "../core/Context";
import { Game } from "./Game";
import { withApp, wrapApp } from "../core/appContext";

const context = new Context<Game | undefined>(undefined);

export const withGame = <T>(game: Game, fn: (game: Game) => T): T =>
	withApp(game, () => context.with(game, fn));

const wrappedFunctions = new WeakMap();
export const wrapGame = <Args extends unknown[], Return extends unknown>(
	game: Game,
	fn: (...args: Args) => Return,
): ((...args: Args) => Return) => {
	if (wrappedFunctions.has(fn)) return wrappedFunctions.get(fn);

	const wrappedFunction = wrapApp(game, context.wrap(game, fn));
	wrappedFunctions.set(fn, wrappedFunction);
	return wrappedFunction;
};

export const currentGame = (): Game => {
	const game = context.current;
	if (!game) throw new Error("Expected an Game context");
	return game;
};
