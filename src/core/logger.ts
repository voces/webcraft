import { currentApp } from "./appContext";

export const logLine = (...data: unknown[]): void => {
	try {
		const time = currentApp().time;
		if (time) data.unshift(time);
	} catch {
		/* do nothing */
	}
	// eslint-disable-next-line no-console
	console.log(...data);
};
