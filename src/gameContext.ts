import { Context } from "./core/Context";
import { Game } from "./Game";
import { withApp, wrapApp } from "./core/appContext";
import { Round } from "./Round";

const context = new Context<Game | undefined>(undefined);

export const withGame = <T>(game: Game, fn: (game: Game) => T): T =>
	withApp(game, () => context.with(game, fn));

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- It is used
export const wrapGame = <Args extends unknown[], Return extends unknown>(
	game: Game,
	fn: (...args: Args) => Return,
): ((...args: Args) => Return) => wrapApp(game, context.wrap(game, fn));

export const currentGame = (): Game => {
	const game = context.current;
	if (!game) throw new Error("Expected an Game context");
	return game;
};

export const currentRound = (): Round => {
	const game = currentGame();
	const round = game.round;
	if (!round) throw new Error("Expected a Round to be in progress");
	return round;
};
