
import System from ".../../../node_modules/knack-ecs/src/System.mjs";
import Player from "../entities/Player.mjs";

const colors = [
	{ name: "red", hex: "#FF0000" },
	{ name: "blue", hex: "#4385FF" },
	{ name: "cyan", hex: "#64FFFF" },
	{ name: "purple", hex: "#820096" },
	{ name: "yellow", hex: "#FFEA00" },
	{ name: "orange", hex: "#FF9900" },
	{ name: "lime", hex: "#BEFF00" },
	{ name: "magenta", hex: "#FF00FF" },
	{ name: "grey", hex: "#808080" },
	{ name: "mint", hex: "#AAFFC3" },
	{ name: "green", hex: "#00BE00" },
	{ name: "brown", hex: "#AA6E28" },
	{ name: "maroon", hex: "#800000" },
	{ name: "navy", hex: "#000080" },
	{ name: "olive", hex: "#808000" },
	{ name: "teal", hex: "#008080" },
	{ name: "lavender", hex: "#E6BEFF" },
	{ name: "pink", hex: "#FFC9DE" },
	{ name: "coral", hex: "#FFD8B1" },
	{ name: "beige", hex: "#FFFAC8" },
	{ name: "white", hex: "#FFFFFF" },
	{ name: "black", hex: "#000000" }
];

export default class WC3PlayerColors extends System {

	constructor( isHost ) {

		super();

		this.addEventListener( "entityAdded", this.onEntityAdded.bind( this ) );
		this.addEventListener( "entityRemoved", this.onEntityRemoved.bind( this ) );

		Object.defineProperties( this, {
			_colors: { value: colors.map( c => Object.assign( { taken: false }, c ) ) },
			_isHost: { value: isHost }
		} );

	}

	test( entity ) {

		return entity instanceof Player;

	}

	onEntityAdded( { entity: { player } } ) {

		if ( ! this._isHost ) return;

		const color = this._colors.find( c => ! c.taken );
		if ( ! color ) throw new Error( "No more colors available!" );

		player.color = color;
		color.taken = true;

	}

	onEntityRemoved( { entity: { player } } ) {

		if ( player.color ) player.color.taken = false;

	}

}
