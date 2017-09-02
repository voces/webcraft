
import Doodad from "./Doodad.js";
import Handle from "../core/Handle.js";

import linearTween from "../tweens/linearTween.js";

class Unit extends Doodad {

	constructor( props ) {

		if ( props.maxLife === undefined ) props.maxLife = 1;
		if ( props.life === undefined ) props.life = props.maxLife;
		if ( props.speed === undefined ) props.speed = 1;

		super( props );

		this.updates = [];

		this._props = {};

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

		if ( this._props.owner === owner ) return;

		this._props.owner = owner;

		// Null and undefined
		if ( owner == undefined ) return;

		if ( this.mesh && this.mesh.accentFaces ) {

			for ( let i = 0; i < this.mesh.accentFaces.length; i ++ )
				this.mesh.geometry.faces[ this.mesh.accentFaces[ i ] ].color.set( owner.color.hex );

			this.mesh.geometry.colorsNeedUpdate = true;

		}

	}

	get owner() {

		return this._props.owner;

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

	nearsAnotherDoodad() {

	}

	onNearsAnotherUnit( delta, callback ) {

		if ( ! this._onNearsAnotherUnit ) {

			++ this.dirty;
			this.updates.push( () => this.checkNearsAnotherUnit() );

		}

		const listeners = this._onNearsAnotherUnit || ( this._onNearsAnotherUnit = {} );
		const specificListners = listeners[ delta ] || ( listeners[ delta ] = [] );

		specificListners.push( callback );

	}

	traverseTo( point, keepListeners ) {

		if ( ! keepListeners ) {

			if ( this._patrolListener ) this.removeEventListener( "traverseFinish", this._patrolListener );
			if ( this._traverseListener ) this.removeEventListener( "traverseToFinish", this._traverseListener );

		}

		const myLinearTween = this.app ? this.app.linearTween : linearTween;

		const angle = "x" in point && "y" in point ? Math.atan2( point.y - this.y, point.x - this.x ) : 1;

		if ( "x" in point ) this.x = myLinearTween( { start: this.x, end: point.x, rate: Math.cos( angle ) * this.speed } );
		if ( "y" in point ) this.y = myLinearTween( { start: this.y, end: point.y, rate: Math.sin( angle ) * this.speed } );

		const checker = () => {

			if ( this.x !== point.x || this.y !== point.y ) return;

			this.dispatchEvent( "traverseToFinish" );

			-- this.dirty;
			this.updates.splice( this.updates.indexOf( checker ), 1 );

		};

		this.updates.push( checker );
		++ this.dirty;

	}

	traverse( points, keepListeners ) {

		// Always erase self
		if ( this._traverseListener ) this.removeEventListener( "traverseToFinish", this._traverseListener );

		if ( ! keepListeners && this._patrolListener )
			this.removeEventListener( "traverseFinish", this._patrolListener );

		let index = 0;

		this._traverseListener = () => {

			if ( index ++ === points.length ) {

				this.removeEventListener( "traverseToFinish", this._traverseListener );
				this.dispatchEvent( "traverseFinish" );

				return;

			}

			this.traverseTo( points[ index ++ ], true );

		};

		this.addEventListener( "traverseToFinish", this._traverseListener );

		this.traverseTo( points[ index ], true );

	}

	patrol( points ) {

		// Always erase self
		if ( this._patrolListener ) this.removeEventListener( "traverseFinish", this._patrolListener );

		this._patrolListener = () => this.traverse( points, true );

		this.addEventListener( "traverseFinish", this._patrolListener );

		this.traverse( points, true );

	}

	toState() {

		return Object.assign( super.toState(), {
			owner: this.owner
		} );

	}

}

Handle.entityTypes.push( Unit );

export default Unit;
