
import Entity from "../../node_modules/knack-ecs/src/Entity.js";

import PlayerComponent from "../components/Player.js";

export default class Player extends Entity {

	static get components() {

		return [ PlayerComponent ];

	}

}
