
import { Geometry, Mesh, MeshPhongMaterial, FaceColors, Vector3, Face3, Color, Raycaster } from "../../node_modules/three/build/three.module.js";

import Collection from "../core/Collection.js";
import { pointInPolygon, pointInSomePolygon } from "../math/geometry.js";
import { isBrowser } from "../misc/env.js";
import Doodad from "./Doodad.js";
import Unit from "./Unit.js";

const raycaster = new Raycaster();

const down = new Vector3( 0, 0, - 1 );
const up = new Vector3( 0, 0, 1 );
const upup = new Vector3( 0, 0, 2 );

class Terrain extends Doodad {

	constructor( props ) {

		super();

		if ( ! this.units ) this.units = props.units || new Collection();
		if ( ! this.doodads ) this.doodads = props.doodads || new Collection();

		this._actives = new Collection();

		Object.assign( this, props );

		if ( this.mesh === undefined ) this._generateMesh( props.cliffmap, props.tilemap, props.tileTypes );

		if ( props.pointer ) this.showPointer( props.app );

		this._entityOnDirty = ( { target } ) => this._actives.push( target ) === 1 ? ++ this.dirty : null;
		this._entityOnClean = ( { target } ) => {

			this._actives.splice( this._actives.indexOf( target ), 1 );
			if ( this._actives.length === 0 ) -- this.dirty;

		};
		this._entityOnMeshLoaded = ( { target } ) => {

			target.z = ( target.height || 0 ) + this.height( target.x, target.y );
			target.mesh.lookAt( this.angle( target.x, target.y ).add( upup ).add( new Vector3( target.x, target.y, target.mesh.position.z ) ) );

		};

	}

	_addActive( entity ) {

		const wasEmpty = this._actives.length === 0;

		this._actives.add( entity );

		if ( wasEmpty ) ++ this.dirty;

	}

	_removeActive( entity ) {

		const wasEmpty = this._actives.length === 0;

		this._actives.remove( entity );

		if ( ! wasEmpty && this._actives.length === 0 ) -- this.dirty;

	}

	add( entity ) {

		if ( entity instanceof Unit ) this.units.add( entity );
		else this.doodads.add( entity );

		if ( entity.mesh ) {

			entity.mesh.position.z = ( entity.height || 0 ) + this.height( entity.mesh.position.x, entity.mesh.position.y );
			entity.mesh.lookAt( this.angle( entity.mesh.position.x, entity.mesh.position.y ).add( upup ).add( entity.mesh.position ) );

		}

		if ( entity.dirty ) this._addActive( entity );

		entity.addEventListener( "meshLoaded", this._entityOnMeshLoaded );
		entity.addEventListener( "dirty", this._entityOnDirty );
		entity.addEventListener( "clean", this._entityOnClean );

	}

	remove( entity ) {

		if ( entity instanceof Unit ) this.units.remove( entity );
		else this.doodads.remove( entity );

		if ( entity.dirty ) this._removeActive( entity );

		entity.removeEventListener( "dirty", this._entityOnDirty );
		entity.removeEventListener( "clean", this._entityOnClean );
		entity.removeEventListener( "meshLoaded", this._entityOnMeshLoaded );

	}

	intersect( x, y ) {

		if ( x === this.intersect.x && y === this.intersect.y ) return this.intersect.intersect;

		raycaster.set( new Vector3( x, y, 500 ), down );
		const intersect = raycaster.intersectObjects( [ this.mesh ] )[ 0 ];

		Object.assign( this.intersect, { x, y, intersect } );

		return intersect;

	}

	height( x, y ) {

		const intersect = this.intersect( x, y );

		if ( ! intersect ) return NaN;

		return intersect.point.z;

	}

	angle( x, y ) {

		const intersect = this.intersect( x, y );

		if ( ! intersect ) return NaN;

		return intersect.face.normal.clone();

	}

	cliff( x, y ) {

		const left = this.mesh.position.x - this.dimensions.width / 2;
		const right = this.mesh.position.x + this.dimensions.width / 2;
		const top = this.mesh.position.y + this.dimensions.height / 2;
		const bottom = this.mesh.position.y - this.dimensions.height / 2;

		const xTile = Math.round( ( x - left ) / ( right - left ) * this.dimensions.width );
		const yTile = this.dimensions.height - Math.round( ( y - bottom ) / ( top - bottom ) * this.dimensions.height );

		try {

			return this._tileHeight( xTile, yTile );

		} catch ( err ) {

			return NaN;

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

	render() {

		for ( let i = 0; i < this._actives.length; i ++ ) {

			const lastZ = this._actives[ i ].z;
			const newZ = ( this._actives[ i ].flyHeight || 0 ) + this.height( this._actives[ i ].x, this._actives[ i ].y );
			if ( lastZ === newZ ) continue;

			this._actives[ i ].z = newZ;
			this._actives[ i ].mesh.lookAt( new Vector3( this._actives[ i ].x, this._actives[ i ].y, this._actives[ i ].z ).add( this.angle( this._actives[ i ].x, this._actives[ i ].y ) ).add( up ) );

		}

	}

	_tileHeight( x, y ) {

		if ( ! isNaN( this._cliffmap[ y ][ x ] ) ) return this._cliffmap[ y ][ x ];

		if ( this._cliffmap[ y ][ x ].toLowerCase() !== "r" ) return;

		const { width, height } = this.dimensions;

		const [ topLeft, top, topRight, left, right, botLeft, bot, botRight ] = [
			y > 0 && x > 0 ? this._cliffmap[ y - 1 ][ x - 1 ] : undefined,
			y > 0 ? this._cliffmap[ y - 1 ][ x ] : undefined,
			y > 0 && x < width ? this._cliffmap[ y - 1 ][ x + 1 ] : undefined,
			x > 0 ? this._cliffmap[ y ][ x - 1 ] : undefined,
			x < width ? this._cliffmap[ y ][ x + 1 ] : undefined,
			y < height && x > 0 ? this._cliffmap[ y + 1 ][ x - 1 ] : undefined,
			y < height ? this._cliffmap[ y + 1 ][ x ] : undefined,
			y < height && x < width ? this._cliffmap[ y + 1 ][ x + 1 ] : undefined
		].map( tile => isNaN( tile ) ? - Infinity : tile );

		const topLeftHeight = Math.max( topLeft, top, left );
		const topRightHeight = Math.max( topRight, top, right );
		const botLeftHeight = Math.max( botLeft, bot, left );
		const botRightHeight = Math.max( botRight, bot, right );

		return Math.min( topLeftHeight, topRightHeight, botLeftHeight, botRightHeight );

	}

	_generateMesh( cliffmap = [[ 0 ]], tilemap = [[ 0 ]], tileTypes = [ { name: "Grass", color: "#608038" } ] ) {

		this._cliffmap = cliffmap;

		const height = cliffmap.length - 1;
		const width = Math.min( ...cliffmap.map( row => row.length ) ) - 1;

		this.dimensions = { width, height };

		const geometry = new Geometry();
		const material = new MeshPhongMaterial( {
			vertexColors: FaceColors,
			flatShading: true
		} );

		function color( x, y ) {

			try {

				const hex = tileTypes[ tilemap[ y ][ x ] ].color.toUpperCase();
				if ( color.colors[ hex ] ) return color.colors[ hex ];

				return color.colors[ hex ] = new Color( hex );

			} catch ( err ) {

				throw new Error( `Tile ( ${x}, ${y} ) uses undefined color ${tilemap[ y ][ x ]}.` );

			}

		}
		color.colors = {};

		const rampWalls = [];

		for ( let y = height; y >= 0; y -- )
			for ( let x = 0; x <= width; x ++ )

				if ( ! isNaN( cliffmap[ y ][ x ] ) ) {

					// Floor
					const index = geometry.vertices.length;
					geometry.vertices.push(
						new Vector3( x, - y, cliffmap[ y ][ x ] ),
						new Vector3( x + 1, - y, cliffmap[ y ][ x ] ),
						new Vector3( x, - y - 1, cliffmap[ y ][ x ] ),
						new Vector3( x + 1, - y - 1, cliffmap[ y ][ x ] )
					);
					geometry.faces.push( new Face3( index + 1, index, index + 2, undefined, color( x, y ) ) );
					geometry.faces.push( new Face3( index + 1, index + 2, index + 3, undefined, color( x, y ) ) );

					// Left wall (next gets right)
					if ( x > 0 ) {

						const altHeight = this._tileHeight( x - 1, y );
						const currentIsLow = cliffmap[ y ][ x ] < altHeight;
						const low = currentIsLow ? cliffmap[ y ][ x ] : altHeight;
						const high = currentIsLow ? altHeight : cliffmap[ y ][ x ];

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

						const altHeight = this._tileHeight( x, y - 1 );
						const currentIsLow = cliffmap[ y ][ x ] < altHeight;
						const low = currentIsLow ? cliffmap[ y ][ x ] : altHeight;
						const high = currentIsLow ? altHeight : cliffmap[ y ][ x ];

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

				} else if ( cliffmap[ y ][ x ].toLowerCase() === "r" ) {

					const nearRaw = [
						y > 0 && x > 0 ? cliffmap[ y - 1 ][ x - 1 ] : undefined,
						y > 0 ? cliffmap[ y - 1 ][ x ] : undefined,
						y > 0 && x < width ? cliffmap[ y - 1 ][ x + 1 ] : undefined,
						x > 0 ? cliffmap[ y ][ x - 1 ] : undefined,
						x < width ? cliffmap[ y ][ x + 1 ] : undefined,
						y < height && x > 0 ? cliffmap[ y + 1 ][ x - 1 ] : undefined,
						y < height ? cliffmap[ y + 1 ][ x ] : undefined,
						y < height && x < width ? cliffmap[ y + 1 ][ x + 1 ] : undefined
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
								typeof cliffmap[ y + walls[ i ].neighbor.y ][ x + walls[ i ].neighbor.x ] === "string" &&
								cliffmap[ y + walls[ i ].neighbor.y ][ x + walls[ i ].neighbor.x ].toLowerCase() === "r" ) )

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

						const currentIsLow = minHeight < cliffmap[ y ][ x - 1 ];
						const low = currentIsLow ? minHeight : cliffmap[ y ][ x - 1 ];
						const high = currentIsLow ? cliffmap[ y ][ x - 1 ] : minHeight;

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

						const currentIsLow = minHeight < cliffmap[ y - 1 ][ x ];
						const low = currentIsLow ? minHeight : cliffmap[ y - 1 ][ x ];
						const high = currentIsLow ? cliffmap[ y - 1 ][ x ] : minHeight;

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

		// Center x & y
		geometry.computeBoundingBox();
		const offset = geometry.boundingBox.getCenter().negate();
		geometry.translate( offset.x, offset.y, 0 );

		for ( let i = 0; i < geometry.vertices.length; i ++ ) {

			geometry.vertices[ i ].x += ( Math.random() - 0.5 ) * ( Math.random() - 0.5 ) * 0.75;
			geometry.vertices[ i ].y += ( Math.random() - 0.5 ) * ( Math.random() - 0.5 ) * 0.75;
			geometry.vertices[ i ].z += ( Math.random() - 0.5 ) * ( Math.random() - 0.5 ) * 0.75;

		}

		geometry.computeFaceNormals();
		geometry.computeVertexNormals();

		this.mesh = new Mesh( geometry, material );

		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;

	}

	showPointer( app ) {

		if ( ! isBrowser ) return;

		import( "../../node_modules/three/build/three.module.js" ).then( ( { SphereBufferGeometry } ) => {

			const ball = new Mesh( new SphereBufferGeometry( 0.0625 ), new MeshPhongMaterial( { color: 0xffffff } ) );
			ball.castShadow = true;
			app.scene.add( ball );

			const ball2 = new Mesh( new SphereBufferGeometry( 0.03125 ), new MeshPhongMaterial( { color: 0xffffff } ) );
			ball2.castShadow = true;
			app.scene.add( ball2 );

			const raycaster = new Raycaster();

			const position = document.createElement( "span" );
			position.style.position = "absolute";
			position.style.right = "1em";
			position.style.bottom = "1em";
			position.style.color = "white";
			position.textContent = "<position>";
			document.body.appendChild( position );

			window.addEventListener( "mousemove", e => {

				const x = ( e.clientX / window.innerWidth ) * 2 - 1;
				const y = - ( e.clientY / window.innerHeight ) * 2 + 1;

				raycaster.setFromCamera( { x, y }, app.camera );
				const intersect = raycaster.intersectObjects( [ app.terrain.mesh ] )[ 0 ];

				if ( ! intersect ) return;
				ball.position.copy( intersect.point );
				ball2.position.copy( intersect.point ).add( intersect.face.normal );

				position.textContent = `( ${intersect.point.x.toFixed( 2 )}, ${intersect.point.y.toFixed( 2 )}, ${intersect.point.z.toFixed( 2 )}), ${app.terrain.cliff( intersect.point.x, intersect.point.y )}`;

			} );

		} );

	}

}

export default Terrain;
