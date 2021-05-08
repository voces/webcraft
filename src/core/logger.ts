import { currentApp } from "./appContext";

export const logLine = (...data: unknown[]): void => {
	let time;
	try {
		time = currentApp().time;
	} catch {
		/* do nothing */
	}
	// eslint-disable-next-line no-console
	console.log(new Date(), time, ...data);
};
