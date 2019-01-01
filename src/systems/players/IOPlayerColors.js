
import System from "../../../node_modules/knack-ecs/src/System.js";
import Player from "../../entities/Player.js";

const toHex = d => ( d = d.toString( 16 ), d.length > 1 ? d : "0" + d );

export default class IOPlayerColors extends System {

	constructor( props = {} ) {

		super();

		this.addEventListener( "entityAdded", this.onEntityAdded.bind( this ) );

		Object.defineProperties( this, {
			_random: { value: props.random || Math.random }
		} );

	}

	randomColor() {

		const r = this._random();
		const g = this._random();
		const b = this._random();

		const max = Math.max( r, g, b );

		return "#" + [ r, g, b ].map( c => toHex( Math.floor( c / max * 255 ) ) ).join( "" );

	}

	test( entity ) {

		return entity instanceof Player;

	}

	onEntityAdded( { entity: player } ) {

		player.color = this.randomColor();

	}

}
