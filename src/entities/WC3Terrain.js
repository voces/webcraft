
import { Geometry, Mesh, MeshPhongMaterial, FaceColors, FlatShading, SphereGeometry, Vector3, Face3, Color } from "../../node_modules/three/build/three.module.js";

import Collection from "../core/Collection.js";
import { pointInPolygon, pointInSomePolygon } from "../math/geometry.js";
import Doodad from "./Doodad.js";

// function setColor( geometry, face, color ) {

// 	geometry.faces[ 2 * face ].color.setHex( color );
// 	geometry.faces[ 2 * face + 1 ].color.setHex( color );

// }

function ball( app, vertex, color = 0x987654 ) {

	const geomentry = new SphereGeometry( 0.25 );
	const material = new MeshPhongMaterial( { color } );
	const mesh = new Mesh( geomentry, material );

	mesh.position.add( vertex );

	app.scene.add( mesh );

	mesh.render = time => {

		if ( ! mesh._startTime ) mesh._startTime = time;

		mesh.rotateOnWorldAxis( { x: 0, y: 1, z: 0 }, ( time - mesh._startTime ) * 0.001 );

	};

	app.renders.add( mesh );

}

function markTile( app, geometry, tile, color ) {

	ball( app, geometry.vertices[ geometry.faces[ tile * 2 ].a ], color );
	ball( app, geometry.vertices[ geometry.faces[ tile * 2 ].b ], color );
	ball( app, geometry.vertices[ geometry.faces[ tile * 2 ].c ], color );
	ball( app, geometry.vertices[ geometry.faces[ tile * 2 + 1 ].b ], color );

}

class Terrain extends Doodad {

	constructor( props ) {

		super();

		Object.assign( this, props );

		if ( ! this.units ) this.units = new Collection();

		if ( this.mesh === undefined ) {

			const heightmap = props.heightmap || [[ 0 ]];

			const height = props.heightmap.length - 1;
			const width = Math.min( ...heightmap.map( row => row.length ) ) - 1;

			const xOffset = width / 2;
			const yOffset = - height / 2;

			const geometry = new Geometry();
			const material = new MeshPhongMaterial( {
				vertexColors: FaceColors,
				shading: FlatShading
			} );

			const color = ( x, y ) => new Color( props.tileTypes[ props.tilemap[ y ][ x ] ].color );

			console.log( { width, height, heightmap } );

			for ( let y = height; y >= 0; y -- )
				for ( let x = 0; x <= width; x ++ ) {

					// Floor
					const index = geometry.vertices.length;
					geometry.vertices.push(
						new Vector3( x, y, heightmap[ y ][ x ] ),
						new Vector3( x + 1, y, heightmap[ y ][ x ] ),
						new Vector3( x, y - 1, heightmap[ y ][ x ] ),
						new Vector3( x + 1, y - 1, heightmap[ y ][ x ] )
					);
					geometry.faces.push( new Face3( index + 1, index, index + 2, undefined, color( x, y ) ) );
					geometry.faces.push( new Face3( index + 1, index + 2, index + 3, undefined, color( x, y ) ) );

					// Left + right wall
					if ( x > 0 ) {

						const currentIsLow = heightmap[ y ][ x ] < heightmap[ y ][ x - 1 ];
						const low = currentIsLow ? heightmap[ y ][ x ] : heightmap[ y ][ x - 1 ];
						const high = currentIsLow ? heightmap[ y ][ x - 1 ] : heightmap[ y ][ x ];

						for ( let z = low; z < high; z ++ ) {

							const index = geometry.vertices.length;
							geometry.vertices.push(
								new Vector3( x, y, z ),
								new Vector3( x, y - 1, z ),
								new Vector3( x, y, z + 1 ),
								new Vector3( x, y - 1, z + 1 )
							);
							if ( currentIsLow ) geometry.faces.push( new Face3( index, index + 2, index + 1 ), new Face3( index + 2, index + 3, index + 1 ) );
							else geometry.faces.push( new Face3( index, index + 1, index + 2 ), new Face3( index + 1, index + 3, index + 2 ) );

						}

					}

					// Top + bottom wall
					if ( y < height ) {

						const currentIsLow = heightmap[ y ][ x ] < heightmap[ y + 1 ][ x ];
						const low = currentIsLow ? heightmap[ y ][ x ] : heightmap[ y + 1 ][ x ];
						const high = currentIsLow ? heightmap[ y + 1 ][ x ] : heightmap[ y ][ x ];

						for ( let z = low; z < high; z ++ ) {

							const index = geometry.vertices.length;
							geometry.vertices.push(
								new Vector3( x, y, z ),
								new Vector3( x + 1, y, z ),
								new Vector3( x, y, z + 1 ),
								new Vector3( x + 1, y, z + 1 )
							);

							if ( currentIsLow ) geometry.faces.push( new Face3( index, index + 1, index + 2 ), new Face3( index + 1, index + 3, index + 2 ) );
							else geometry.faces.push( new Face3( index, index + 2, index + 1 ), new Face3( index + 2, index + 3, index + 1 ) );

						}

					}

				}

			geometry.rotateX( - Math.PI / 2 + 0.04 );
			geometry.mergeVertices();
			geometry.computeBoundingBox();
			geometry.center();

			for ( let i = 0; i < geometry.vertices.length; i ++ ) {

				geometry.vertices[ i ].x += ( Math.random() - 0.5 ) * ( Math.random() - 0.5 );
				geometry.vertices[ i ].y += ( Math.random() - 0.5 ) * ( Math.random() - 0.5 );
				geometry.vertices[ i ].z += ( Math.random() - 0.5 ) * ( Math.random() - 0.5 ) * 0.5;

			}

			// markTile( props.app, geometry, 0, 0xff0000 );
			// markTile( props.app, geometry, 2, 0x00ff00 );
			// markTile( props.app, geometry, 4, 0x0000ff );

			// Randomly rotate squares 50% of squares
			for ( let i = 0; i < geometry.faces.length / 2; i ++ )
				if ( Math.random() < 0.5 ) {

					geometry.faces[ i * 2 ].c = geometry.faces[ i * 2 + 1 ].b;
					geometry.faces[ i * 2 + 1 ].a = geometry.faces[ i * 2 ].a;

				}

			// if ( props.tiles )
			// 	for ( let i = 0; i < props.tiles.length && i * 2 + 1 < geometry.faces.length; i ++ ) {

			// 		geometry.faces[ i * 2 ].color.setStyle( props.tileTypes[ props.tiles[ i ] ].color );
			// 		geometry.faces[ i * 2 + 1 ].color.setStyle( props.tileTypes[ props.tiles[ i ] ].color );

			// 	}

			geometry.computeFaceNormals();
			geometry.computeVertexNormals();

			this.mesh = new Mesh( geometry, material );

			this.mesh.position.y = - 6;

			setTimeout( () => ++ this.dirty );

		}

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

	render( time ) {

		if ( ! this._initialTime ) this._initialTime = time;

		this.mesh.rotation.y = ( time - this._initialTime ) * - 0.0005;
		// this.mesh.rotation.x = ( time - this._initialTime ) * 0.0005;

		// this.mesh.position.y -= 0.1;

	}

}

export default Terrain;
