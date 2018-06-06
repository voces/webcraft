
import Component from "../../node_modules/knack-ecs/src/Component.js";

export default class Player extends Component {

	constructor( { username } = {} ) {

		super();

		this.username = username;

	}

}
