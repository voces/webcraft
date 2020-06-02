
import swallow from "./swallow.js";

const cAF = typeof cancelAnimationFrame === "undefined" ?
	swallow<typeof cancelAnimationFrame>() :
	cancelAnimationFrame;

const doc = typeof document === "undefined" ? swallow<Document>() : document;
const loc = typeof location === "undefined" ? swallow<Location>() : location;

const rAF = typeof requestAnimationFrame === "undefined" ?
	swallow<typeof requestAnimationFrame>() :
	requestAnimationFrame;

const storage = typeof localStorage === "undefined" ? swallow<Storage>() : localStorage;
const win = typeof window === "undefined" ? swallow<Window>() : window;

export {
	cAF as cancelAnimationFrame,
	doc as document,
	loc as location,
	rAF as requestAnimationFrame,
	storage as localStorage,
	win as window,
};
