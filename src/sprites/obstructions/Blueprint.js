
import Sprite from "../Sprite.js";

export default class Blueprint extends Sprite {

	static buildTime = 0;

	constructor( { x, y, radius } ) {

		super( { x, y, radius, selectable: false, id: - 1 } );
		this.elem.classList.add( "blueprint" );

	}

}
