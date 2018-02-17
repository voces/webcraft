
import { Geometry, Mesh, MeshPhongMaterial, FaceColors, Vector3, Face3, Color } from "../../node_modules/three/build/three.module.js";

import Collection from "../core/Collection.js";
import { pointInPolygon, pointInSomePolygon } from "../math/geometry.js";
import Doodad from "./Doodad.js";

class Terrain extends Doodad {

	constructor( props ) {

		super();
		const balls = [];

		if ( ! this.units ) this.units = new Collection();

		Object.assign( this, props );

		if ( this.mesh === undefined ) {

			const heightmap = this.heightmap = props.heightmap || [[ 0 ]];
			const tilemap = this.tilemap = props.tilemap || [[ 0 ]];
			const tileTypes = this.tileTypes = props.tileTypes || [ { name: "Grass", color: "#608038" } ];

			const height = this.height = heightmap.length - 1;
			const width = this.width = Math.min( ...heightmap.map( row => row.length ) ) - 1;

			const geometry = new Geometry();
			const material = new MeshPhongMaterial( {
				vertexColors: FaceColors,
				flatShading: true
			} );

			const color = ( x, y ) => {

				try {

					return new Color( tileTypes[ tilemap[ y ][ x ] ].color );

				} catch ( err ) {

					throw new Error( `Tile ( ${x}, ${y} ) uses undefined color ${tilemap[ y ][ x ]}.` );

				}

			};

			const rampWalls = [];

			for ( let y = height; y >= 0; y -- )
				for ( let x = 0; x <= width; x ++ )

					if ( ! isNaN( heightmap[ y ][ x ] ) ) {

						// Floor
						const index = geometry.vertices.length;
						geometry.vertices.push(
							new Vector3( x, - y, heightmap[ y ][ x ] ),
							new Vector3( x + 1, - y, heightmap[ y ][ x ] ),
							new Vector3( x, - y - 1, heightmap[ y ][ x ] ),
							new Vector3( x + 1, - y - 1, heightmap[ y ][ x ] )
						);
						geometry.faces.push( new Face3( index + 1, index, index + 2, undefined, color( x, y ) ) );
						geometry.faces.push( new Face3( index + 1, index + 2, index + 3, undefined, color( x, y ) ) );

						// Left wall (next gets right)
						if ( x > 0 ) {

							const altHeight = this._getHeight( x - 1, y );
							const currentIsLow = heightmap[ y ][ x ] < altHeight;
							const low = currentIsLow ? heightmap[ y ][ x ] : altHeight;
							const high = currentIsLow ? altHeight : heightmap[ y ][ x ];

							for ( let z = low; z < high; z ++ ) {

								const index = geometry.vertices.length;
								geometry.vertices.push(
									new Vector3( x, - y, z ),
									new Vector3( x, - y - 1, z ),
									new Vector3( x, - y, z + 1 ),
									new Vector3( x, - y - 1, z + 1 )
								);
								if ( currentIsLow ) geometry.faces.push( new Face3( index + 1, index, index + 2 ), new Face3( index + 1, index + 2, index + 3 ) );
								else geometry.faces.push( new Face3( index + 2, index, index + 1 ), new Face3( index + 2, index + 1, index + 3 ) );

							}

						}

						// Top wall (next gets bottom)
						if ( y > 0 ) {

							const altHeight = this._getHeight( x, y - 1 );
							const currentIsLow = heightmap[ y ][ x ] < altHeight;
							const low = currentIsLow ? heightmap[ y ][ x ] : altHeight;
							const high = currentIsLow ? altHeight : heightmap[ y ][ x ];

							for ( let z = low; z < high; z ++ ) {

								const index = geometry.vertices.length;
								geometry.vertices.push(
									new Vector3( x, - y, z ),
									new Vector3( x + 1, - y, z ),
									new Vector3( x, - y, z + 1 ),
									new Vector3( x + 1, - y, z + 1 )
								);
								if ( currentIsLow ) geometry.faces.push( new Face3( index + 2, index, index + 1 ), new Face3( index + 2, index + 1, index + 3 ) );
								else geometry.faces.push( new Face3( index + 1, index, index + 2 ), new Face3( index + 1, index + 2, index + 3 ) );

							}

						}

					} else if ( heightmap[ y ][ x ].toLowerCase() === "r" ) {

						const nearRaw = [
							y > 0 && x > 0 ? heightmap[ y - 1 ][ x - 1 ] : undefined,
							y > 0 ? heightmap[ y - 1 ][ x ] : undefined,
							y > 0 && x < width ? heightmap[ y - 1 ][ x + 1 ] : undefined,
							x > 0 ? heightmap[ y ][ x - 1 ] : undefined,
							x < width ? heightmap[ y ][ x + 1 ] : undefined,
							y < height && x > 0 ? heightmap[ y + 1 ][ x - 1 ] : undefined,
							y < height ? heightmap[ y + 1 ][ x ] : undefined,
							y < height && x < width ? heightmap[ y + 1 ][ x + 1 ] : undefined
						];

						const near = nearRaw.map( tile => isNaN( tile ) ? - Infinity : tile );
						const [ topLeft, top, topRight, left, right, botLeft, bot, botRight ] = near;

						const topLeftHeight = Math.max( topLeft, top, left );
						const topRightHeight = Math.max( topRight, top, right );
						const botLeftHeight = Math.max( botLeft, bot, left );
						const botRightHeight = Math.max( botRight, bot, right );

						const index = geometry.vertices.length;
						geometry.vertices.push(
							new Vector3( x, - y, topLeftHeight ),
							new Vector3( x + 1, - y, topRightHeight ),
							new Vector3( x, - y - 1, botLeftHeight ),
							new Vector3( x + 1, - y - 1, botRightHeight )
						);

						geometry.faces.push( new Face3( index + 1, index, index + 2, undefined, color( x, y ) ) );
						geometry.faces.push( new Face3( index + 1, index + 2, index + 3, undefined, color( x, y ) ) );

						const walls = [ { a: 0, b: 1, neighbor: { x: 0, y: - 1 } }, { a: 1, b: 3, neighbor: { x: 1, y: 0 } }, { a: 3, b: 2, neighbor: { x: 0, y: 1 } }, { a: 2, b: 0, neighbor: { x: - 1, y: 0 } } ];
						for ( let i = 0; i < walls.length; i ++ ) {

							// Don't put triangles where they won't be seen
							if ( y + walls[ i ].neighbor.y < 0 || y + walls[ i ].neighbor.y > height ||
								x + walls[ i ].neighbor.x < 0 || x + walls[ i ].neighbor.x > width || (
									typeof heightmap[ y + walls[ i ].neighbor.y ][ x + walls[ i ].neighbor.x ] === "string" &&
									heightmap[ y + walls[ i ].neighbor.y ][ x + walls[ i ].neighbor.x ].toLowerCase() === "r" ) )

								continue;

							const a = geometry.vertices[ index + walls[ i ].a ];
							const b = geometry.vertices[ index + walls[ i ].b ];

							if ( a.z !== b.z && ( a.x === b.x || a.y === b.y ) ) {

								const z = Math.min( a.z, b.z );
								const { x, y } = a.z === z ? b : a;
								const v = new Vector3( x, y, z );

								const newVertex = geometry.vertices.push( v ) - 1;
								rampWalls.push( new Face3( index + walls[ i ].a, index + walls[ i ].b, newVertex ) );

							}

						}

						const minHeight = Math.min( topLeftHeight, topRightHeight, botLeftHeight, botRightHeight );

						// Left wall (next gets right)
						if ( topLeftHeight !== botLeftHeight && x > 0 ) {

							const currentIsLow = minHeight < heightmap[ y ][ x - 1 ];
							const low = currentIsLow ? minHeight : heightmap[ y ][ x - 1 ];
							const high = currentIsLow ? heightmap[ y ][ x - 1 ] : minHeight;

							for ( let z = low; z < high; z ++ ) {

								const index = geometry.vertices.length;
								geometry.vertices.push(
									new Vector3( x, - y, z ),
									new Vector3( x, - y - 1, z ),
									new Vector3( x, - y, z + 1 ),
									new Vector3( x, - y - 1, z + 1 )
								);
								if ( currentIsLow ) geometry.faces.push( new Face3( index + 1, index, index + 2 ), new Face3( index + 1, index + 2, index + 3 ) );
								else geometry.faces.push( new Face3( index + 2, index, index + 1 ), new Face3( index + 2, index + 1, index + 3 ) );

							}

						}

						// Top wall (next gets bottom)
						if ( topLeftHeight !== topRightHeight && y > 0 ) {

							const currentIsLow = minHeight < heightmap[ y - 1 ][ x ];
							const low = currentIsLow ? minHeight : heightmap[ y - 1 ][ x ];
							const high = currentIsLow ? heightmap[ y - 1 ][ x ] : minHeight;

							for ( let z = low; z < high; z ++ ) {

								const index = geometry.vertices.length;
								geometry.vertices.push(
									new Vector3( x, - y, z ),
									new Vector3( x + 1, - y, z ),
									new Vector3( x, - y, z + 1 ),
									new Vector3( x + 1, - y, z + 1 )
								);
								if ( currentIsLow ) geometry.faces.push( new Face3( index + 2, index, index + 1 ), new Face3( index + 2, index + 1, index + 3 ) );
								else geometry.faces.push( new Face3( index + 1, index, index + 2 ), new Face3( index + 1, index + 2, index + 3 ) );

							}

						}

					}

			// Randomly rotate 50% of squares
			for ( let i = 0; i < geometry.faces.length / 2; i ++ )
				if ( Math.random() < 0.5 ) {

					geometry.faces[ i * 2 ].c = geometry.faces[ i * 2 + 1 ].c;
					geometry.faces[ i * 2 + 1 ].a = geometry.faces[ i * 2 ].b;

				}

			geometry.faces.push( ...rampWalls );

			geometry.mergeVertices();

			for ( let i = 0; i < geometry.vertices.length; i ++ ) {

				geometry.vertices[ i ].x += ( Math.random() - 0.5 ) * ( Math.random() - 0.5 ) * 0.75;
				geometry.vertices[ i ].y += ( Math.random() - 0.5 ) * ( Math.random() - 0.5 ) * 0.75;
				geometry.vertices[ i ].z += ( Math.random() - 0.5 ) * ( Math.random() - 0.5 ) * 0.75;

			}

			geometry.center();
			geometry.computeFaceNormals();
			geometry.computeVertexNormals();

			this.mesh = new Mesh( geometry, material );

			if ( balls.length ) this.mesh.add( ...balls );

			this.mesh.castShadow = true;
			this.mesh.receiveShadow = true;

			// props.app.renders.add( ( time, delta ) => this.mesh.rotateZ( delta * - 0.00005 ) );

		}

	}

	_getHeight( x, y ) {

		if ( ! isNaN( this.heightmap[ y ][ x ] ) ) return this.heightmap[ y ][ x ];

		if ( this.heightmap[ y ][ x ].toLowerCase() !== "r" ) return;

		const [ topLeft, top, topRight, left, right, botLeft, bot, botRight ] = [
			y > 0 && x > 0 ? this.heightmap[ y - 1 ][ x - 1 ] : undefined,
			y > 0 ? this.heightmap[ y - 1 ][ x ] : undefined,
			y > 0 && x < this.width ? this.heightmap[ y - 1 ][ x + 1 ] : undefined,
			x > 0 ? this.heightmap[ y ][ x - 1 ] : undefined,
			x < this.width ? this.heightmap[ y ][ x + 1 ] : undefined,
			y < this.height && x > 0 ? this.heightmap[ y + 1 ][ x - 1 ] : undefined,
			y < this.height ? this.heightmap[ y + 1 ][ x ] : undefined,
			y < this.height && x < this.width ? this.heightmap[ y + 1 ][ x + 1 ] : undefined
		].map( tile => isNaN( tile ) ? - Infinity : tile );

		const topLeftHeight = Math.max( topLeft, top, left );
		const topRightHeight = Math.max( topRight, top, right );
		const botLeftHeight = Math.max( botLeft, bot, left );
		const botRightHeight = Math.max( botRight, bot, right );

		return Math.min( topLeftHeight, topRightHeight, botLeftHeight, botRightHeight );

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
