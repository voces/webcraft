
import EventDispatcher from "../core/EventDispatcher.js";
import { diff } from "../math/set.js";

let rectId = 0;

class Rect extends EventDispatcher {

	// Can pass as two points or four values
	constructor( p1, p2, x2, y2, props = {} ) {

		super();

		this.id = rectId ++;

		// Passed as x1, y1, x2, y2
		if ( typeof p1 === "number" ) {

			this.minX = Math.min( p1, x2 );
			this.maxX = Math.max( p1, x2 );
			this.minY = Math.min( p2, y2 );
			this.maxY = Math.max( p2, y2 );

		// Passed as {x1, y1}, {x2, y2}

		} else if ( p1.x !== undefined ) {

			this.minX = Math.min( p1.x, p2.x );
			this.maxX = Math.max( p1.x, p2.x );
			this.minY = Math.min( p1.y, p2.y );
			this.maxY = Math.max( p1.y, p2.y );

			if ( x2 !== undefined ) props = x2;

		// Not passed?

		} else {

			if ( p1 !== undefined ) props = p1;

		}

		if ( props.unitEnter ) this.addEventListener( "unitEnter", props.unitEnter );
		if ( props.unitLeave ) this.addEventListener( "unitLeave", props.unitLeave );

		Object.assign( this, { units: [] }, props );

	}

	get key() {

		return "r" + this.id;

	}

	addEventListener( type, ...args ) {

		if ( ( type === "unitEnter" || type === "unitLeave" ) && ( ! this._listeners.unitEnter || ! this._listeners.unitEnter.length ) && ( ! this._listeners.unitLeave || ! this._listeners.unitLeave.length ) )
			this.dispatchEvent( "dirty" );

		super.addEventListener( type, ...args );

	}

	// Returns true if a point-like object (with .x and .y) is contained by the rect
	contains( point ) {

		if ( point.x === undefined || point.y === undefined ) return;

		return point.x <= this.maxX && point.x >= this.minX && point.y <= this.maxY && point.y >= this.minY;

	}

	get center() {

		return {
			x: ( this.maxX + this.minX ) / 2,
			y: ( this.maxY + this.minY ) / 2
		};

	}

	get area() {

		return ( this.maxX - this.minX ) * ( this.maxY - this.minY );

	}

	calculateEnter( obj ) {

		// Also, check when the _props were defined (start)
		if ( obj._props === undefined || ( typeof obj._props.x !== "function" && typeof obj._props.y !== "function" ) )
			return NaN;

		if ( obj._props.x !== "function" ) {

			if ( obj._props.y.rate < 0 ) return obj._props.y.seek( this.maxY );
			return obj._props.y.seek( this.minY );

		} else if ( obj._props.y !== "function" ) {

			if ( obj._props.x.rate < 0 ) return obj._props.x.seek( this.maxX );
			return obj._props.x.seek( this.minX );

		}

		const xDelta = obj._props.x.rate < 0 ? Math.abs( obj.x - this.maxX ) : Math.abs( obj.x - this.minX ),
			yDelta = obj._props.y.rate < 0 ? Math.abs( obj.y - this.maxY ) : Math.abs( obj.y - this.minY );

		return xDelta < yDelta ?
			obj._props.x.seek( obj._props.x.rate < 0 ? this.maxX : this.minX ) :
			obj._props.y.seek( obj._props.y.rate < 0 ? this.maxY : this.minY );

	}

	calculateLeave( obj ) {

		// Also, check when the _props were defined (start)
		if ( obj._props === undefined || ( typeof obj._props.x !== "function" && typeof obj._props.y !== "function" ) ) this.time;

		if ( typeof obj._props.x !== "function" ) {

			if ( obj._props.y.rate < 0 ) return obj._props.y.seek( this.minY );
			return obj._props.y.seek( this.maxY );

		} else if ( typeof obj._props.y !== "function" ) {

			if ( obj._props.x.rate < 0 ) return obj._props.x.seek( this.minX );
			return obj._props.x.seek( this.maxX );

		}

		const xDelta = obj._props.x.rate < 0 ? Math.abs( obj.x - this.minX ) : Math.abs( obj.x - this.maxX ),
			yDelta = obj._props.y.rate < 0 ? Math.abs( obj.y - this.minY ) : Math.abs( obj.y - this.maxY );

		return xDelta < yDelta ?
			obj._props.x.seek( obj._props.x.rate < 0 ? this.minX : this.maxX ) :
			obj._props.y.seek( obj._props.y.rate < 0 ? this.minY : this.maxY );

	}

	toJSON() {

		return {
			key: this.key,
			_collection: "rects"
		};

	}

	update() {

		if ( ! this.area ) return;

		const units = this.candidateUnits.filter( unit => this.contains( unit ) ).sort( ( a, b ) => a.id > b.id );

		const [ enters, leaves ] = diff( units, this.units, "id" );

		this.units = units;

		if ( enters.length === 0 && leaves.length === 0 ) return;

		const subevents = [];

		// if ( this._listeners.unitEnter && this._listeners.unitEnter.length )
		for ( let i = 0; i < enters.length; i ++ )
			subevents.push( { type: "unitEnter", unit: enters[ i ], time: this.calculateEnter( enters[ i ] ), target: this } );

		// if ( this._listeners.unitLeave && this._listeners.unitLeave.length )
		for ( let i = 0; i < leaves.length; i ++ )
			subevents.push( { type: "unitLeave", unit: leaves[ i ], time: this.calculateLeave( leaves[ i ] ), target: this } );

		this.dispatchEvent( "subevents", { subevents } );

	}

}

export default Rect;
