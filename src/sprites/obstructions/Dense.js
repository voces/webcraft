
import Obstruction from "./Obstruction.js";

export default class Dense extends Obstruction {

	static radius = 1;
	static maxHealth = 240;
	static buildTime = 1;
	static armor = 0.25;
	static cost = { essence: 4 };

	constructor( props ) {

		super( props );
		this.elem.style.boxShadow = "inset 0 0 16px rgba(0,0,0,0.75)";

	}

}
