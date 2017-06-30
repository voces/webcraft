
import EventDispatcher from "./EventDispatcher.js";
import { isServer } from "../misc/env.js";

let id;

class Handle extends EventDispatcher {

	constructor( serverOnly ) {

		super();

		if ( ! serverOnly || isServer )
			this.id = id ++;

	}

	get key() {

		return "h" + this.id;

	}

	toJSON() {

		return {
			_key: this.key,
			_collection: "handles"
		};

	}

}

export default Handle;
