
import Doodad from "./Doodad.js";
import Handle from "../core/Handle.js";

class Unit extends Doodad {

	constructor( props ) {

		if ( props.maxLife === undefined ) props.maxLife = 1;
		if ( props.life === undefined ) props.life = props.maxLife;

		super( props );

		this.updates = [];

		this.shadowProps = {};

		if ( this.entityType === Unit ) Object.assign( this, props );

		this._dirty = 0;

		this.addEventListener( "death", () => this.onDeath() );

	}

	get key() {

		return "u" + this.id;

	}

	set key( key ) {

		this.id = parseInt( key.slice( 1 ) );

	}

	set owner( owner ) {

		if ( this.shadowProps.owner === owner ) return;

		this.shadowProps.owner = owner;

		// Null and undefined
		if ( owner == undefined ) return;

		if ( this.mesh && this.mesh.accentFaces ) {

			for ( let i = 0; i < this.mesh.accentFaces.length; i ++ )
				this.mesh.geometry.faces[ this.mesh.accentFaces[ i ] ].color.set( owner.color.hex );

			this.mesh.geometry.colorsNeedUpdate = true;

		}

	}

	get owner() {

		return this.shadowProps.owner;

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

		if ( value <= 0 ) this.dispatchEvent( { type: "death", target: this } );

	}

	kill() {

		this.life = 0;
		this.x = this.x;
		this.y = this.y;

	}

	onDeath() {

		if ( this.app && this.app.scene && this.mesh ) this.app.scene.remove( this.mesh );

	}

	toState() {

		return Object.assign( super.toState(), {
			owner: this.owner
		} );

	}

}

Handle.entityTypes.push( Unit );

export default Unit;
