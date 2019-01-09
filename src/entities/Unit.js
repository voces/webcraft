
import Doodad from "./Doodad.js";

export default class Unit extends Doodad {

	static get properties() {

		return super.properties( "life", "maxLife", "alive" );

	}

	static get defaultData() {

		return { ...super.defaultData, maxLife: 100, life: 100, alive: true };

	}

	// TODO: should play death animation (defaulting to simple removal of model)
	// TODO: delay to remove should be configurable
	// TODO: removing the entity should be configurable
	kill() {

		this.life = 0;
		setTimeout( () => this.remove(), 120 );

	}

	onUpdatedLife() {

		if ( this.life <= 0 && this.alive )
			this.alive = false;
		else if ( this.life >= 0 && ! this.alive )
			this.alive = true;

	}

}
