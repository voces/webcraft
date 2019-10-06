
import swallow from "./swallow.js";

const doc = typeof document === "undefined" ? swallow() : document;
const win = typeof window === "undefined" ? swallow() : window;
const loc = typeof location === "undefined" ? swallow() : location;
const rAF = typeof requestAnimationFrame === "undefined" ? swallow() : requestAnimationFrame;
const cAF = typeof cancelAnimationFrame === "undefined" ? swallow() : cancelAnimationFrame;

export {
	doc as document,
	win as window,
	loc as location,
	rAF as requestAnimationFrame,
	cAF as cancelAnimationFrame,
};
