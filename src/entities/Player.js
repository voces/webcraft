
import Entity from "../../node_modules/knack-ecs/src/Entity.js";

export default class Player extends Entity {

	static get properties() {

		return super.properties( "color", "account" );

	}

}
