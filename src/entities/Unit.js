
import Doodad from "./Doodad.js";
import Handle from "../core/Handle.js";
import { diff } from "../math/set.js";

import linearTween from "../tweens/linearTween.js";
import sleepTween from "../tweens/sleepTween.js";
import stepTween from "../tweens/stepTween.js";

class Unit extends Doodad {

	constructor( props = {} ) {

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

	// TODO: add .time to the events with a guess of when the near/retreat occured
	checkNear() {

		const listeners = this._onNearsAnotherUnit;

		for ( const distance in listeners )
			for ( let i = 0; i < listeners[ distance ].length; i ++ ) {

				const { arr, callback, near } = listeners[ distance ][ i ];
				const newNear = arr.filter( e => ( ( e.x - this.x ) ** 2 + ( e.y - this.y ) ** 2 + ( e.z - this.z ) ** 2 ) ** ( 1 / 2 ) < distance );
				const [ newNears, newRetreats ] = diff( newNear, near, "id" );

				listeners[ distance ][ i ].near = newNear;

				if ( newNears.length === 0 && newRetreats.length === 0 ) return;

				callback( { type: "near", nears: newNears, retreats: newRetreats, target: this } );

			}

	}

	onNear( arr, distance, callback ) {

		if ( ! this._onNearsAnotherUnit ) {

			++ this.dirty;
			this.updates.push( () => this.checkNear() );

		}

		const listeners = this._onNearsAnotherUnit || ( this._onNearsAnotherUnit = {} );
		const specificListners = listeners[ distance ] || ( listeners[ distance ] = [] );

		specificListners.push( {
			arr,
			callback,
			near: arr.filter( e => ( ( e.x - this.x ) ** 2 + ( e.y - this.y ) ** 2 + ( e.z - this.z ) ** 2 ) ** ( 1 / 2 ) < distance )
		} );

	}

	traverseTo( point ) {

		const tween = this.app ? this.app.linearTween : linearTween;

		const angle = "x" in point && "y" in point ? Math.atan2( point.y - this.y, point.x - this.x ) : 1;

		if ( "x" in point ) this.x = tween( {
			start: this.x,
			end: point.x,
			control1: point.control1 !== undefined ? point.control1.x : undefined,
			control2: point.control2 !== undefined ? point.control2.x : undefined,
			rate: Math.cos( angle ) * this.speed
		} );

		if ( "y" in point ) this.y = tween( {
			start: this.y,
			end: point.y,
			control1: point.control1 !== undefined ? point.control1.y : undefined,
			control2: point.control2 !== undefined ? point.control2.y : undefined,
			rate: Math.cos( angle ) * this.speed
		} );

	}

	traverse( points, patrol = false ) {

		const myLinearTween = this.app ? this.app.linearTween : linearTween;
		const mySleepTween = this.app ? this.app.sleepTween : sleepTween;
		const myStepTween = this.app ? this.app.stepTween : stepTween;

		const start = this.x === points[ 0 ].x && this.y === points[ 0 ].y ? 1 : 0;

		points[ - 1 ] = this;
		if ( patrol && ( points[ 0 ].x !== points[ points.length - 1 ].x || points[ 0 ].y !== points[ points.length - 1 ].y ) )
			points.push( points[ start - 1 ] );

		const xTweens = [];
		const yTweens = [];
		let startTime = this.app ? this.app.time : Date.now();
		for ( let i = start; i < points.length; i ++ ) {

			const angle = Math.atan2( points[ i ].y - points[ i - 1 ].y, points[ i ].x - points[ i - 1 ].x );
			const xTween = myLinearTween( {
				start: points[ i - 1 ].x,
				end: points[ i ].x,
				rate: Math.cos( angle ) * this.speed,
				startTime
			} );
			const yTween = myLinearTween( {
				start: points[ i - 1 ].y,
				end: points[ i ].y,
				rate: Math.sin( angle ) * this.speed,
				startTime
			} );

			if ( xTween.duration ) xTweens.push( xTween );
			else if ( yTween.duration ) xTweens.push( mySleepTween( { startTime, duration: yTween.duration, value: points[ i ].x } ) );

			if ( yTween.duration ) yTweens.push( yTween );
			else if ( xTween.duration ) yTweens.push( mySleepTween( { startTime, duration: xTween.duration, value: points[ i ].y } ) );

			startTime += ( xTween.duration || yTween.duration || 0 ) * 1000;

		}

		if ( xTweens.length ) this.x = myStepTween( { steps: xTweens, loop: patrol } );
		else this.x = this.x;

		if ( yTweens.length ) this.y = myStepTween( { steps: yTweens, loop: patrol } );
		else this.y = this.y;

	}

	patrol( points ) {

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
