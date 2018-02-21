
import Doodad from "./Doodad.js";
import Handle from "../core/Handle.js";

class Destructible extends Doodad {

	constructor( props = {} ) {

		if ( props.maxLife === undefined ) props.maxLife = 1;
		if ( props.life === undefined ) props.life = props.maxLife;
		if ( props.speed === undefined ) props.speed = 1;

		super( props );

		if ( this.entityType === Destructible ) Object.assign( this, props );

		this._dirty = 0;

		this.addEventListener( "death", () => this.onDeath() );

	}

	get key() {

		return "d" + this.id;

	}

	set key( key ) {

		this.id = parseInt( key.slice( 1 ) );

	}

	get alive() {

		return this._life > 0;

	}

	get dead() {

		return this._life <= 0;

	}

	get life() {

		return this._life;

	}

	set life( value ) {

		this._live = value;

		if ( value <= 0 ) this.dispatchEvent( "death" );

	}

	kill() {

		this.life = 0;
		this.x = this.x;
		this.y = this.y;

	}

	onDeath() {

		if ( this.mesh ) this.dispatchEvent( "meshUnloaded" );

	}

	toState() {

		return Object.assign( super.toState(), {
			life: this._life
		} );

	}

}

Handle.entityTypes.push( Destructible );

export default Destructible;
