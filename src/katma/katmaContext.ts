import { currentApp, withApp, wrapApp } from "../core/appContext";
import { Katma } from "./Katma";
import { isKatma } from "./typeguards";

export const withKatma = <T>(katma: Katma, fn: (katma: Katma) => T): T =>
	withApp(katma, fn);

export const wrapKatma = <Args extends unknown[], Return extends unknown>(
	katma: Katma,
	fn: (...args: Args) => Return,
): ((...args: Args) => Return) => wrapApp(katma, fn);

export const currentKatma = (): Katma => {
	const app = currentApp();
	if (!isKatma(app)) throw new Error("Expected a Katma context");
	return app;
};
