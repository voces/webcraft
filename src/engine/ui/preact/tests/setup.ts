import { configure } from "enzyme";
import Adapter from "enzyme-adapter-preact-pure";
import { JSDOM } from "jsdom";

// Setup JSDOM
const dom = new JSDOM("", {
	// Enable `requestAnimationFrame` which Preact uses internally.
	pretendToBeVisual: true,
});

global.Event = dom.window.Event;
global.Node = dom.window.Node;
Object.defineProperty(global, "window", { value: dom.window });
global.document = dom.window.document;
global.requestAnimationFrame = dom.window.requestAnimationFrame;

// Setup Enzyme
configure({ adapter: new Adapter() });
