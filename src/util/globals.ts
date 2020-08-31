import { swallow } from "./swallow";

const cAF =
	typeof cancelAnimationFrame === "undefined"
		? swallow<typeof cancelAnimationFrame>()
		: cancelAnimationFrame;

const doc =
	typeof document === "undefined"
		? swallow<Document>({
				createElement: () =>
					swallow({
						getContext: () =>
							swallow({
								getParameter: () =>
									"WebGL 2.0 (OpenGL ES 3.0 Chromium)",
							}),
					}),
		  })
		: document;

const loc = typeof location === "undefined" ? swallow<Location>() : location;

const rAF =
	typeof requestAnimationFrame === "undefined"
		? swallow<typeof requestAnimationFrame>()
		: requestAnimationFrame;

const storage =
	typeof localStorage === "undefined" ? swallow<Storage>() : localStorage;
const win = typeof window === "undefined" ? swallow<Window>() : window;

export {
	cAF as cancelAnimationFrame,
	doc as document,
	loc as location,
	rAF as requestAnimationFrame,
	storage as localStorage,
	win as window,
};
