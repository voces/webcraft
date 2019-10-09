
import Sprite from "../Sprite.js";
import game from "../../index.js";
import { INITIAL_OBSTRUCTION_PROGRESS } from "../../constants.js";
import tweenValues from "../../util/tweenValues.js";
import tilemap from "./tilemap.js";

export default class Obstruction extends Sprite {

	static buildTime = 1;
	static armor = 0.15;

	tilemap = tilemap( this.radius );

	constructor( props ) {

		super( props );
		this.health = Math.round( Math.max( this.constructor.maxHealth * INITIAL_OBSTRUCTION_PROGRESS, 1 ) );
		const tween = tweenValues( this.health, this.constructor.maxHealth );
		let lastHealth = this.health;
		const start = game.round.lastUpdate;
		let buildProgress = INITIAL_OBSTRUCTION_PROGRESS;
		let renderProgress = INITIAL_OBSTRUCTION_PROGRESS;
		let renderedHealth = lastHealth;
		let lastRenderedHealth = lastHealth;

		this.action = {
			update: delta => {

				renderProgress = buildProgress = Math.min( buildProgress + delta / this.constructor.buildTime, 1 );
				const newHealth = tween( buildProgress );
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
				buildProgress,
				lastHealth,
			} ),
		};

	}

}
