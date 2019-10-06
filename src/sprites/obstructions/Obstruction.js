
import Sprite from "../Sprite.js";
import game from "../../index.js";
import { INITIAL_OBSTRUCTION_PROGRESS } from "../../constants.js";
import tweenValues from "../../util/tweenValues.js";

export default class Obstruction extends Sprite {

	static buildTime = 1;

	constructor( props ) {

		super( props );
		this.health = Math.round( Math.max( this.maxHealth * INITIAL_OBSTRUCTION_PROGRESS, 1 ) );
		const tween = tweenValues( this.health, this.maxHealth );
		let lastHealth = this.health;
		const start = game.round.lastUpdate;
		let updateProgress = INITIAL_OBSTRUCTION_PROGRESS;
		let renderProgress = INITIAL_OBSTRUCTION_PROGRESS;
		let renderedHealth = lastHealth;
		let lastRenderedHealth = lastHealth;

		this.action = {
			update: delta => {

				renderProgress = updateProgress = Math.min( updateProgress + delta / this.constructor.buildTime, 1 );
				const newHealth = tween( updateProgress );
				const deltaHealth = Math.round( newHealth - lastHealth );
				this.health += deltaHealth;
				renderedHealth = this.health;
				lastHealth += deltaHealth;
				lastRenderedHealth = lastHealth;

				if ( game.round.lastUpdate >= start + this.constructor.buildTime )
					this.action = undefined;

			},
			render: delta => {

				renderProgress = Math.min( renderProgress + delta / this.constructor.buildTime, 1 );
				const newHealth = tween( renderProgress );
				const deltaHealth = Math.round( newHealth - lastRenderedHealth );
				renderedHealth += deltaHealth;
				lastRenderedHealth += deltaHealth;

				this.elem.style.opacity = renderedHealth / this.constructor.maxHealth;

			},
			toJSON: () => ( {
				name: "construct",
			} ),
		};

	}

}
