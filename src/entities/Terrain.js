
import Collection from "../core/Collection.js";

import { pointInPolygon, pointInSomePolygon } from "../math/geometry.js";

class Terrain {

	constructor( props ) {

		Object.assign( this, props );

		if ( ! this.units ) this.units = new Collection();

	}

	set heightmap( heightmap ) {

		this._props.heightmap = heightmap;

	}
	get heightmap() {

		return this._props.heightmap;

	}

	// This is meant to be optimized using a quadtree
	selectUnitsBoundedByRect( rect ) {

		if ( ! this.units || ! this.units.length ) return [];

		return this.units.filter( unit => rect.contains( unit ) );

	}

	selectUnitsBoundedByPolygon( polygon ) {

		if ( ! this.units || ! this.units.length ) return [];

		return this.units.filter( unit => pointInPolygon( unit, polygon ) );

	}

	selectUnitsBoundedByPolygons( polygons ) {

		if ( ! this.units || ! this.units.length ) return [];

		return this.units.filter( unit => pointInSomePolygon( unit, polygons ) );

	}

}

export default Terrain;
