
const assert = require( "assert" );

import Collection from "../../../../src/core/Collection.js";
import WC3Terrain from "../../../../src/entities/WC3Terrain.js";
import Rect from "../../../../src/misc/Rect.js";

export default () => describe( "WC3Terrain", () => {

	it( "constructor( <{ <units> }> )", () => {

		const terrain1Props = { a: Math.random() };
		assert.deepEqual( new WC3Terrain( terrain1Props ), Object.assign( { units: new Collection() }, terrain1Props ) );

		const terrain2Units = new Collection();
		assert.equal( new WC3Terrain( { units: terrain2Units } ).units, terrain2Units );

	} );

	it( "selectUnitsBoundedByRect( rect )", () => {

		const terrain = new WC3Terrain( { units: [ { x: 0, y: 0 } ] } );
		const rectInside = new Rect( - 1, - 1, 1, 1 );
		const rectOutside = new Rect( - 2, - 2, - 1, - 1 );
		const rectOn = new Rect( 0, 0, 1, 1 );

		assert.deepEqual( terrain.selectUnitsBoundedByRect( rectInside ), terrain.units );
		assert.deepEqual( terrain.selectUnitsBoundedByRect( rectOutside ), [] );
		assert.deepEqual( terrain.selectUnitsBoundedByRect( rectOn ), terrain.units );

	} );

	it( "selectUnitsBoundedByPolygon( polygon )", () => {

		const terrain = new WC3Terrain( { units: [ { x: 0, y: 0 } ] } );
		const polygonInside = [ { x: - 1, y: - 1 }, { x: - 1, y: 1 }, { x: 1, y: 1 }, { x: 1, y: - 1 } ];
		const polygonOutside = [ { x: - 2, y: - 2 }, { x: - 2, y: - 1 }, { x: - 1, y: - 1 }, { x: - 1, y: - 2 } ];
		const polygonOn = [ { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 0 } ];

		assert.deepEqual( terrain.selectUnitsBoundedByPolygon( polygonInside ), terrain.units );
		assert.deepEqual( terrain.selectUnitsBoundedByPolygon( polygonOutside ), [] );
		assert.deepEqual( terrain.selectUnitsBoundedByPolygon( polygonOn ), terrain.units );

	} );

	it( "selectUnitsBoundedByPolygons( [ polygon<, ...polygon> ] )", () => {

		const terrain = new WC3Terrain( { units: [ { x: 0, y: 0 } ] } );
		const polygonInside = [ { x: - 1, y: - 1 }, { x: - 1, y: 1 }, { x: 1, y: 1 }, { x: 1, y: - 1 } ];
		const polygonOutside = [ { x: - 2, y: - 2 }, { x: - 2, y: - 1 }, { x: - 1, y: - 1 }, { x: - 1, y: - 2 } ];

		assert.deepEqual( terrain.selectUnitsBoundedByPolygons( [ polygonInside ] ), terrain.units );
		assert.deepEqual( terrain.selectUnitsBoundedByPolygons( [ polygonOutside ] ), [] );
		assert.deepEqual( terrain.selectUnitsBoundedByPolygons( [ polygonInside, polygonOutside ] ), terrain.units );

	} );

} );
