
import Sprite from "../Sprite.js";

export default class Blueprint extends Sprite {

	static buildTime = 0;

	constructor( props ) {

		super( { ...props, selectable: false, id: - 1, color: "rgba( 70, 145, 246, 0.5 )" } );

	}

}
