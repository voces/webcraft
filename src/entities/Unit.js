
import Entity from "../../node_modules/knack-ecs/src/Entity.js";

import Model from "../components/Model.js";

export default class Unit extends Entity {

	static get components() {

		return [ Model ];

	}

}
