import { currentApp, withApp, wrapApp } from "../core/appContext";
import type { MazingContest } from "./MazingContest";
import { isMazingContest } from "./typeguards";

export const withMazingContest = <T>(
	MazingContest: MazingContest,
	fn: (MazingContest: MazingContest) => T,
): T => withApp(MazingContest, fn);

export const wrapMazingContest = <
	Args extends unknown[],
	Return extends unknown
>(
	MazingContest: MazingContest,
	fn: (...args: Args) => Return,
): ((...args: Args) => Return) => wrapApp(MazingContest, fn);

export const currentMazingContest = (): MazingContest => {
	const app = currentApp();
	if (!isMazingContest(app))
		throw new Error("Expected a MazingContest context");
	return app;
};
