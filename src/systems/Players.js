
import System from "../System.js";
import Player from "../Player.js";

export default class Players extends System {

	get attachments() {

		const attachments = {
			players: this
		};

		Object.defineProperty( this, "attachments", { value: attachments } );

		return attachments;

	}

	test( object ) {

		return object instanceof Player;

	}

}
