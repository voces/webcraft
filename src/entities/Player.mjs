
import Entity from "../../node_modules/knack-ecs/src/Entity.mjs";

export default class Player extends Entity {

	static get properties() {

		return super.properties( "color", "account" );

	}

}
