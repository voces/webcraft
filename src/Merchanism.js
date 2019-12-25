
import { makeDispatcher } from "./util/EventDispatcher.js";

// A merchanism is a container of code that does not work on individual
// entities. Examples would be UI management, network management, or user
// input.
export default class Mechanism {

	constructor() {

		makeDispatcher( this );

	}

}
