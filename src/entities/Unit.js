
import EventDispatcher from "../core/EventDispatcher.js";

import models from "./models.js";

let unitId = 0;

class Unit extends EventDispatcher {

	constructor( props ) {

		super();

		this.updates = [];

		this.shadowProps = {};

		Object.assign( this, props );

		if ( this.id === undefined )
			this.id = unitId ++;

		this.key = "u" + this.id;

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

		return this.shadowProps.x;

	}

	set x( x ) {

		this.shadowProps.x = x;

		if ( typeof x === "function" ) this.track( () => this.mesh ? this.mesh.position.x = x() : null );
		else if ( this.mesh ) this.mesh.position.x = x;

	}

	get y() {

		return this.shadowProps.y;

	}

	set y( y ) {

		this.shadowProps.y = y;

		if ( typeof y === "function" ) this.track( () => this.mesh ? this.mesh.position.y = y() : null );
		else if ( this.mesh ) this.mesh.position.y = y;

	}

	track( func ) {

		if ( this.updates.length === 0 ) {

			console.log( "dirty" );
			this.dispatchEvent( { type: "dirty" } );

		}

		this.updates.push( func );

	}

}

export default Unit;
