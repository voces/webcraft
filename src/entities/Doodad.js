
import Entity from "../../node_modules/knack-ecs/src/Entity.js";

import Model from "../components/Model.js";

export default class Doodad extends Entity {

	static get properties() {

		return super.properties( "x", "y" );

	}

	static get components() {

		return [ Model ];

	}

	static get defaultData() {

		return { x: 0, y: 0 };

	}

	onUpdatedX() {

		if ( this.model ) this.model.x = this.x;

	}

	onUpdatedY() {

		if ( this.model ) this.model.y = this.y;

	}

	distanceTo( pointLike ) {

		return ( ( pointLike.x - this.x ) ** 2 + ( pointLike.y - this.y ) ** 2 ) ** ( 1 / 2 );

	}

}
