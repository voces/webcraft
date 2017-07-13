
import Handle from "../core/Handle.js";
import { isBrowser } from "../misc/env.js";

import models from "./models.js";

class Doodad extends Handle {

	constructor( props ) {

		super( props );

		this.updates = [];

		this.shadowProps = {};

		Object.assign( this, { x: 0, y: 0 }, props );

		this._dirty = 0;

	}

	get key() {

		return "d" + this.id;

	}

	get model() {

		return this.shadowProps.model;

	}

	set model( model ) {

		this.shadowProps.model = model;

		if ( models[ model ].prototype instanceof THREE.Mesh ) {

			this.mesh = new models[ model ]( model );
			this.mesh.userData = this.id;

		} else models[ model ].addEventListener( "ready", ( { model: modelClass } ) => {

			this.mesh = new modelClass( model );

			this.mesh.userData = this.id;
			this.mesh.position.x = this.shadowProps.x || 0;
			this.mesh.position.y = this.shadowProps.y || 0;
			this.mesh.position.z = this.shadowProps.z || 0;

			if ( this.owner && this.mesh.accentFaces ) {

				for ( let i = 0; i < this.mesh.accentFaces.length; i ++ )
					this.mesh.geometry.faces[ this.mesh.accentFaces[ i ] ].color.set( this.owner.color.hex );

				this.mesh.geometry.colorsNeedUpdate = true;

			}

		} );

	}

	get mesh() {

		return this.shadowProps.mesh;

	}

	set mesh( mesh ) {

		if ( this.shadowProps.mesh instanceof THREE.Mesh )
			this.dispatchEvent( { type: "meshUnloaded" } );

		this.shadowProps.mesh = mesh;

		this.dispatchEvent( { type: "meshLoaded" } );

	}

	get x() {

		if ( typeof this.shadowProps.x === "function" )
			return this.shadowProps.x( this.app ? this.app.time : 0 );

		return this.shadowProps.x;

	}

	set x( x ) {

		// console.log( this.constructor.name, x );

		if ( typeof x === "function" && typeof this.shadowProps.x !== "function" ) ++ this.dirty;
		else if ( typeof x !== "function" ) {

			if ( this.mesh ) this.mesh.position.x = x;
			if ( typeof this.shadowProps.x === "function" )++ this.dirty;

		}

		this.shadowProps.x = x;

	}

	get y() {

		if ( typeof this.shadowProps.y === "function" )
			return this.shadowProps.y( this.app ? this.app.time : 0 );

		return this.shadowProps.y;

	}

	set y( y ) {

		if ( typeof y === "function" && typeof this.shadowProps.y !== "function" ) ++ this.dirty;
		else if ( typeof y !== "function" ) {

			if ( this.mesh ) this.mesh.position.y = y;
			if ( typeof this.shadowProps.y === "function" )++ this.dirty;

		}

		this.shadowProps.y = y;

	}

	get dirty() {

		return this._dirty;

	}

	set dirty( dirt ) {

		if ( isNaN( dirt ) ) dirt = 0;

		if ( ! this._dirty && dirt ) this.dispatchEvent( { type: "dirty" } );
		else if ( this._dirty && ! dirt ) this.dispatchEvent( { type: "clean" } );

		this._dirty = dirt;

	}

	toState() {

		return Object.assign( super.toState(), {
			_constructor: this.constructor.name,
			x: this.shadowProps.x || this.x,
			y: this.shadowProps.y || this.y,
			facing: this.facing
		} );

	}

	render( time ) {

		if ( ! isBrowser || ! this.mesh ) return;

		if ( typeof this.shadowProps.x === "function" ) this.mesh.position.x = this.shadowProps.x( time );
		if ( typeof this.shadowProps.y === "function" ) this.mesh.position.y = this.shadowProps.y( time );

	}

	update( time ) {

		for ( let i = 0; i < this.updates.length; i ++ )
			this.updates[ i ]( time );

	}

}

export default Doodad;
