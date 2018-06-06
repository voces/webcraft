
import App from "../../../src/App.js";
import Graphic from "../../../src/systems/Graphic.js";
import PlayerColors from "../../../src/systems/PlayerColors.js";

class Powerline extends App {

	constructor( ...args ) {

		super( ...args );

		this.addSystem( new Graphic() );
		this.addSystem( new PlayerColors() );

	}

}

export default Powerline;
