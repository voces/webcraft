
import swallow from "./swallow.js";

const cAF = typeof cancelAnimationFrame === "undefined" ? swallow() : cancelAnimationFrame;
const doc = typeof document === "undefined" ? swallow() : document;
const loc = typeof location === "undefined" ? swallow() : location;
const rAF = typeof requestAnimationFrame === "undefined" ? swallow() : requestAnimationFrame;
const storage = typeof localStorage === "undefined" ? swallow() : localStorage;
const win = typeof window === "undefined" ? swallow() : window;

export {
	cAF as cancelAnimationFrame,
	doc as document,
	loc as location,
	rAF as requestAnimationFrame,
	storage as localStorage,
	win as window,
};
