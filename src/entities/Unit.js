
import Doodad from "./Doodad.js";

class Unit extends Doodad {

	constructor( props ) {

		super( props );

		this.updates = [];

		this.shadowProps = {};

		if ( this.entityType === Unit )
			Object.assign( this, { x: 0, y: 0 }, props );

		this._dirty = 0;

	}

	get key() {

		return "u" + this.id;

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

	toState() {

		return Object.assign( super.toState(), {
			owner: this.owner
		} );

	}

}

export default Unit;
