
import EventDispatcher from "../core/EventDispatcher.js";

import { pointInSomePolygon, areaOfPolygons } from "../math/geometry.js";

let regionId = 0;

class Region extends EventDispatcher {

	constructor( props = {} ) {

		super();

		this.id = regionId ++;

		if ( props.unitEnter ) this.addEventListener( "unitEnter", props.unitEnter );
		if ( props.unitLeave ) this.addEventListener( "unitLeave", props.unitLeave );

		Object.assign( this, { units: [] }, props );

	}

	get area() {

		if ( ! this.polygons || ! this.polygons.length ) return NaN;

		return areaOfPolygons( this.polygons );

	}

	get polygon() {

		return this.polygons[ 0 ];

	}

	set polygon( polygon ) {

		this.polygons = [ polygon ];

	}

	addEventListener( type, ...args ) {

		console.log( "Region.addEventListener", type );

		if ( ( type === "unitEnter" || type === "unitLeave" ) && ( ! this._listeners.unitEnter || ! this._listeners.unitEnter.length ) && ( ! this._listeners.unitLeave || ! this._listeners.unitLeave.length ) )
			this.dispatchEvent( { type: "dirty" } );

		super.addEventListener( type, ...args );

	}

	_diffOptimized( setA, setB, prop ) {

		const aUnique = [],
			bUnique = [],
			shared = [];

		for ( let i = 0, n = 0; i < setA.length && n < setB.length; ) {

			if ( setA[ i ][ prop ] < setB[ n ][ prop ] ) {

				aUnique.push( setA[ i ] );
				i ++;

			} else if ( setA[ i ][ prop ] > setB[ n ][ prop ] ) {

				bUnique.push( setB[ n ] );
				n ++;

			} else {

				shared.push( setA[ i ] );
				i ++; n ++;

			}

			if ( setA[ i ] === undefined && n < setB.length ) bUnique.push( ...setB.slice( n ) );
			if ( setB[ n ] === undefined && i < setA.length ) aUnique.push( ...setA.slice( i ) );

		}

		return [ aUnique, bUnique, shared ];

	}

	// Assumes ordered
	diff( setA, setB, compare ) {

		if ( setA.length === 0 ) return [[], setA.slice( 0 ), []];
		else if ( setB.length === 0 ) return [ setB.slice( 0 ), [], []];

		if ( typeof compare !== "function" ) return this._diffOptimized( setA, setB, compare );

		const aUnique = [],
			bUnique = [],
			shared = [];

		for ( let i = 0, n = 0; i < setA.length || n < setB.length; ) {

			const relation = compare( setA[ i ], setB[ i ] );

			if ( relation < 0 ) {

				aUnique.push( setA[ i ] );
				i ++;

			} else if ( relation > 0 ) {

				bUnique.push( setB[ n ] );
				n ++;

			} else {

				shared.push( setA[ i ] );
				i ++; n ++;

			}

		}

		return [ aUnique, bUnique, shared ];

	}

	update() {

		if ( ! this.area ) return;

		let units;

		if ( this.terrain ) units = [].concat( ...this.polygons.map( polygon => this.terrain.selectUnitsBoundedByPolygon( polygon ) ) );
		else if ( this.app && this.app.terrain ) units = [].concat( ...this.polygons.map( polygon => this.app.terrain.selectUnitsBoundedByPolygon( polygon ) ) );
		else if ( this.candidateUnits ) units = this.candidateUnits.filter( unit => pointInSomePolygon( unit, this.polygons ) );
		else return console.error( "No source of units." );

		units.sort( ( a, b ) => a.id > b.id );

		const [ enters, leaves ] = this.diff( units, this.units );

		this.units = units;

		// This is non-deterministic; we should find exactly when units entered/left and dispatch in that ordered
		//  Said seeking would require complex polygon + ray intersection, which isn't fund
		for ( let i = 0; i < enters.length; i ++ ) this.dispatchEvent( { type: "unitEnter", unit: enters[ i ] } );
		for ( let i = 0; i < leaves.length; i ++ ) this.dispatchEvent( { type: "unitLeave", unit: leaves[ i ] } );

	}

}

export default Region;
