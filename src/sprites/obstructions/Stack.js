
import Obstruction from "./Obstruction.js";

export default class Stack extends Obstruction {

	static radius = 1;
	static maxHealth = 15;
	static buildTime = 2;
	static requiresPathing = 0;
	static cost = { essence: 15 };

	constructor( props ) {

		super( props );
		this.elem.style.transform = "rotate(45deg) scale(0.7071067811865475)";

	}

}
