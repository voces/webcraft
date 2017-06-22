
import { pointInPolygon, pointInSomePolygon } from "../math/geometry.js";

class Terrain {

	constructor( props ) {

		Object.assign( this, props );

	}

	// THis is meant to be optimized using a quadtree
	selectUnitsBoundedByRectangle( rect ) {

		let units = this.units || this.app && this.app.units;

		if ( ! units || ! units.length ) return [];

		return units.filter( unit => rect.contains( unit ) );

	}

	selectUnitsBoundedByPolygon( polygon ) {

		let units = this.units || this.app && this.app.units;

		if ( ! units || ! units.length ) return [];

		return units.filter( unit => pointInPolygon( unit, polygon ) );

	}

	selectUnitsBoundedByPolygons( polygons ) {

		let units = this.units || this.app && this.app.units;

		if ( ! units || ! units.length ) return [];

		return units.filter( unit => pointInSomePolygon( unit, polygons ) );

	}

}

export default Terrain;
