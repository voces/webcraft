
import BinaryHeap from "./BinaryHeap.js";
import memoize from "./memoize.js";
import { PATHING_TYPES } from "../constants.js";

const DEFAULT_RESOLUTION = 1;

const MAX_TRIES = 8192;

class Tile {

	// Maps an entity to their pathing on this tile
	entities = new Map();

	constructor( xTile, yTile, xWorld, yWorld, pathing ) {

		this.x = xTile;
		this.y = yTile;
		this.world = { x: xWorld, y: yWorld };
		this.pathing = this.originalPathing = pathing;

	}

	addEntity( entity, pathing ) {

		this.entities.set( entity, pathing );
		this.recalculatePathing();

	}

	removeEntity( entity ) {

		this.entities.delete( entity );
		this.recalculatePathing();

	}

	updateEntity( entity, pathing ) {

		if ( this.entities.get( entity ) === pathing ) return;
		this.addEntity( entity, pathing );

	}

	recalculatePathing() {

		this.pathing = this.originalPathing;
		this.entities.forEach( pathing => this.pathing |= pathing );

	}

	pathable( pathing ) {

		return ( this.pathing & pathing ) === 0;

	}

}

// const elems = [];
const elems = false;

// eslint-disable-next-line no-unused-vars
export default class Tilemap {

	// Maps entities to tiles
	entities = new Map()

	constructor( { pathing, resolution = DEFAULT_RESOLUTION } ) {

		this.resolution = resolution;

		this.heightWorld = pathing.length;
		this.widthWorld = pathing[ 0 ].length;

		this.heightMap = this.heightWorld * this.resolution;
		this.widthMap = this.widthWorld * this.resolution;

		this.grid = [];
		// Create tiles
		for ( let y = 0; y < pathing.length; y ++ )
			for ( let x = 0; x < pathing[ y ].length; x ++ )

				for ( let y2 = 0; y2 < this.resolution; y2 ++ ) {

					if ( ! this.grid[ y * this.resolution + y2 ] )
						this.grid[ y * this.resolution + y2 ] = [];

					for ( let x2 = 0; x2 < this.resolution; x2 ++ ) {

						const tile = new Tile(
							x * this.resolution + x2,
							y * this.resolution + y2,
							x + x2 / this.resolution,
							y + y2 / this.resolution,
							pathing[ y ][ x ]
						);
						this.grid[ y * this.resolution + y2 ][ x * this.resolution + x2 ] = tile;

					}

				}

		// Tell them about each other
		for ( let y = 0; y < this.grid.length; y ++ )
			for ( let x = 0; x < this.grid[ y ].length; x ++ ) {

				const nodes = this.grid[ y ][ x ].nodes = [];

				// Above
				if ( y > 0 ) nodes.push( this.grid[ y - 1 ][ x ] );
				// Left
				if ( x > 0 ) nodes.push( this.grid[ y ][ x - 1 ] );
				// Right
				if ( x < this.widthMap - 1 ) nodes.push( this.grid[ y ][ x + 1 ] );
				// Below
				if ( y < this.heightMap - 1 ) nodes.push( this.grid[ y + 1 ][ x ] );

				// Reorder nodes to have some tie-breaking
				// for ( let i = 0; i < nodes.length; i ++ ) {

				// 	const i2 = Math.floor( nodes.length * ( random ? random() : Math.random() ) );
				// 	if (i !== i2) {
				// 		nodes = nodes.slice(0, i2) + nodes[i]
				// 	}
				// 	nodes.push( ...nodes.splice( i, 1 ) );

				// }

			}

	}

	_pathable( map, xTile, yTile ) {

		if ( xTile < 0 || yTile < 0 || xTile >= this.widthMap || yTile >= this.heightMap )
			return false;

		let i = 0;

		for ( let y = yTile + map.top; y < yTile + map.height + map.top; y ++, i ++ )
			for ( let x = xTile + map.left; x < xTile + map.width + map.left; x ++ )
				if ( this.grid[ y ] === undefined || this.grid[ y ][ x ] === undefined || this.grid[ y ][ x ].pathing & map.map[ i ] )
					return false;

		return true;

	}

	pathable( entity, xWorld, yWorld ) {

		if ( xWorld === undefined ) xWorld = entity.x;
		if ( yWorld === undefined ) yWorld = entity.y;

		const xTile = this.xWorldToTile( xWorld );
		const yTile = this.yWorldToTile( yWorld );
		const map = this.pointToTilemap(
			xWorld,
			yWorld,
			entity.radius,
			{
				type: entity.requiresPathing === undefined ?
					entity.pathing :
					entity.requiresPathing,
			}
		);

		return this.withoutEntity( entity, () =>
			this._pathable( map, xTile, yTile ) );

	}

	// Make this more efficient by storing known tiles
	withoutEntity( entity, fn ) {

		const removed = this.entities.has( entity );
		if ( removed ) this.removeEntity( entity );

		const result = fn();

		if ( removed ) this.addEntity( entity );

		return result;

	}

	nearestPathing( xWorld, yWorld, entity ) {

		const xTile = Math.max( Math.min( Math.round( xWorld * this.resolution ), this.widthMap - 1 ), 0 );
		const yTile = Math.max( Math.min( Math.round( yWorld * this.resolution ), this.heightMap - 1 ), 0 );

		// If initial position is fine, push it
		if ( this._pathable(
			this.pointToTilemap(
				xWorld,
				yWorld,
				entity.radius,
				{
					includeOutOfBounds: true,
					type: entity.requiresPathing === undefined ?
						entity.pathing :
						entity.requiresPathing,
				}
			),
			xTile,
			yTile
		) )
			return { x: xWorld, y: yWorld };

		// Calculate input from non-entity input
		const target = { x: xWorld, y: yWorld };

		// Calculate constants from entity
		const pathing = entity.requiresPathing === undefined ?
			entity.pathing :
			entity.requiresPathing;
		const minimalTilemap = this.pointToTilemap(
			entity.radius,
			entity.radius,
			entity.radius,
			{ type: pathing }
		);
		const radiusOffset = entity.radius % ( 1 / this.resolution );
		const offset = point => ( { x: point.x + radiusOffset, y: point.y + radiusOffset } );

		// Create our heap
		const distance = ( a, b ) => ( b.x - a.x ) ** 2 + ( b.y - a.y ) ** 2;
		const tag = Math.random();
		const openHeap = new BinaryHeap( node => node.__np );

		// Seed our heap
		const start = this.grid[ yTile ][ xTile ];
		start.__npTag = tag;
		start.__np = distance( target, offset( start.world ) );
		openHeap.push( start );

		// Find a node!
		while ( openHeap.length ) {

			const current = openHeap.pop();

			if ( this._pathable( minimalTilemap, current.x, current.y ) )
				return offset( current.world );

			current.nodes.forEach( neighbor => {

				if ( neighbor.__npTag === tag ) return;
				neighbor.__npTag = tag;
				neighbor.__np = distance( target, offset( neighbor.world ) );

				openHeap.push( neighbor );

			} );

		}

		// Found nothing, return input
		return { x: xWorld, y: yWorld };

	}

	nearestSpiralPathing( xWorld, yWorld, entity/* , layer = entity.layer*/ ) {

		const originalX = xWorld;
		const originalY = yWorld;

		let xTile = this.xWorldToTile( xWorld );
		let yTile = this.yWorldToTile( yWorld );

		if ( entity.structure ) {

			if ( this._pathable( entity.tilemap, xTile, yTile ) )
				return {
					x: this.xTileToWorld( xTile ),
					y: this.yTileToWorld( yTile ),
				};

		} else if ( this._pathable(
			this.pointToTilemap(
				xWorld,
				yWorld,
				entity.radius,
				{
					includeOutOfBounds: true,
					type: entity.requiresPathing === undefined ?
						entity.pathing :
						entity.requiresPathing,
				}
			),
			xTile,
			yTile
		) )
			return { x: xWorld, y: yWorld };

		const xMiss = Math.abs( xWorld * this.resolution - xTile );
		const yMiss = Math.abs( yWorld * this.resolution - yTile );

		// todo mirror WC3 for equal misses
		// 0 down, 1 left, 2 up, 3 right
		let direction =
			Math.abs( 0.5 - xMiss ) > Math.abs( 0.5 - yMiss ) ?
				xMiss < 0.5 ?
					1 :
					3 :
				yMiss < 0.5 ?
					2 :
					0;

		let steps = 0;
		const stride = entity.structure ? 2 : 1;
		let initialSteps = 0;

		let remainingTries = MAX_TRIES;

		let minimalTilemap;
		let offset;
		if ( entity.structure ) {

			minimalTilemap = entity.tilemap;
			offset = {
				x: entity.tilemap.left / this.resolution,
				y: entity.tilemap.top / this.resolution,
			};

		} else {

			minimalTilemap = this.pointToTilemap(
				entity.radius,
				entity.radius,
				entity.radius, {
					type: entity.requiresPathing === undefined ?
						entity.pathing :
						entity.requiresPathing,
				}
			);
			offset = {
				x: entity.radius % ( 1 / this.resolution ),
				y: entity.radius % ( 1 / this.resolution ),
			};

		}

		const tried = [];
		if ( this.grid[ yTile ] && this.grid[ yTile ][ xTile ] )
			tried.push( this.grid[ yTile ][ xTile ] );

		while (
			! this._pathable( minimalTilemap, xTile, yTile ) ||
			false
			// layer !== undefined && attemptLayer !== layer
		) {

			if ( ! remainingTries -- ) return { x: originalX, y: originalY };

			switch ( direction ) {

				case 0: yTile += stride; break;
				case 1: xTile -= stride; break;
				case 2: yTile -= stride; break;
				case 3: xTile += stride; break;

			}

			if ( this.grid[ yTile ] && this.grid[ yTile ][ xTile ] )
				tried.push( this.grid[ yTile ][ xTile ] );

			if ( steps === 0 ) {

				steps = initialSteps;
				if ( direction === 0 || direction === 2 ) initialSteps ++;
				direction = ( direction + 1 ) % 4;

			} else steps --;

			// if ( sameLevel ) {

			// 	if ( minimalTilemap.width % 2 === 0 )
			// 		xWorld = xTile * TILE_SIZE - this.widthWorld / 2;
			// 	else
			// 		xWorld = ( xTile + 0.5 ) * TILE_SIZE - this.widthWorld / 2;

			// 	if ( minimalTilemap.height % 2 === 0 )
			// 		yWorld = ( - yTile - 1 + this.heightWorld / TILE_SIZE ) * TILE_SIZE - this.heightWorld / 2;
			// 	else
			// 		yWorld = ( - yTile - 1 + this.heightWorld / TILE_SIZE + 0.5 ) * TILE_SIZE - this.heightWorld / 2;

			// 	// attemptHeight = app.terrain.groundHeight( x, y );
			// 	attemptHeight = 0;

			// }

		}

		// if ( ! sameLevel ) {

		// 	if ( minimalTilemap.width % 2 === 0 )
		// 		xWorld = xTile * TILE_SIZE - this.widthWorld / 2;
		// 	else
		// 		xWorld = ( xTile + 0.5 ) * TILE_SIZE - this.widthWorld / 2;

		// 	if ( minimalTilemap.height % 2 === 0 )
		// 		yWorld = ( - yTile - 1 + this.heightWorld / TILE_SIZE ) * TILE_SIZE - this.heightWorld / 2;
		// 	else
		// 		yWorld = ( - yTile - 1 + this.heightWorld / TILE_SIZE + 0.5 ) * TILE_SIZE - this.heightWorld / 2;

		// }

		return {
			x: this.xTileToWorld( xTile ) + offset.x,
			y: this.yTileToWorld( yTile ) + offset.y,
		};

	}

	worldToTile( world ) {

		return this.grid[ this.yWorldToTile( world.y ) ][ this.xWorldToTile( world.x ) ];

	}

	xWorldToTile( x ) {

		return Math.floor( x * this.resolution );

	}

	yWorldToTile( y ) {

		return Math.floor( y * this.resolution );

	}

	xTileToWorld( x ) {

		return x / this.resolution;

	}

	yTileToWorld( y ) {

		return y / this.resolution;

	}

	pointToTilemap(
		xWorld,
		yWorld,
		radius = 0,
		{
			type = PATHING_TYPES.WALKABLE,
			includeOutOfBounds = false,
		} = {}
	) {

		radius -= Number.EPSILON * radius * this.widthWorld;

		const xTile = this.xWorldToTile( xWorld );
		const yTile = this.yWorldToTile( yWorld );

		const map = [];

		const xMiss = xTile / this.resolution - xWorld;
		const yMiss = yTile / this.resolution - yWorld;

		const minX = Math.max(
			this.xWorldToTile( xWorld - radius ) - xTile,
			includeOutOfBounds ? - Infinity : - xTile
		);
		const maxX = Math.min(
			this.xWorldToTile( xWorld + radius ) - xTile,
			includeOutOfBounds ? Infinity : this.widthMap - xTile - 1
		);
		const minY = Math.max(
			this.yWorldToTile( yWorld - radius ) - yTile,
			includeOutOfBounds ? - Infinity : - yTile
		);
		const maxY = Math.min(
			this.yWorldToTile( yWorld + radius ) - yTile,
			includeOutOfBounds ? Infinity : this.heightMap - yTile - 1
		);

		for ( let tY = minY; tY <= maxY; tY ++ )
			for ( let tX = minX; tX <= maxX; tX ++ ) {

				const yDelta = tY < 0 ? ( tY + 1 ) / this.resolution + yMiss : tY > 0 ? tY / this.resolution + yMiss : 0;
				const xDelta = tX < 0 ? ( tX + 1 ) / this.resolution + xMiss : tX > 0 ? tX / this.resolution + xMiss : 0;

				if ( Math.sqrt( xDelta ** 2 + yDelta ** 2 ) < radius )
					map.push( type );
				else
					map.push( 0 );

			}

		const footprint = {
			map,
			top: minY,
			left: minX,
			width: maxX - minX + 1,
			height: maxY - minY + 1,
		};

		return footprint;

	}

	// Adapted from https://github.com/bgrins/javascript-astar/blob/master/astar.js
	// towards Theta*
	// This gets really sad when a path is not possible
	path( entity, target ) {

		if ( typeof entity.radius !== "number" ) throw new Error( "Can only path find radial entities" );

		const cache = {
			_linearPathable: memoize( ( ...args ) => this._linearPathable( ...args, cache ) ),
			_pathable: memoize( ( ...args ) => this._pathable( ...args, cache ) ),
			pointToTilemap: memoize( ( ...args ) => this.pointToTilemap( ...args ) ),
		};

		const removed = this.entities.has( entity );
		if ( removed ) this.removeEntity( entity );

		// We assume an entity shoved into the top left corner is good
		const pathing = entity.requiresPathing === undefined ?
			entity.pathing :
			entity.requiresPathing;
		const minimalTilemap = cache.pointToTilemap(
			entity.radius,
			entity.radius,
			entity.radius,
			{ type: pathing }
		);

		const nudge = Number.EPSILON * entity.radius * this.widthWorld;
		const offset = entity.radius % ( 1 / this.resolution );
		const realStart = { x: entity.x * this.resolution, y: entity.x * this.resolution };
		const start = this.grid[ Math.round( entity.y * this.resolution - nudge ) ][ Math.round( entity.x * this.resolution - nudge ) ];
		const targetTile = this.grid[ Math.round( target.y * this.resolution - nudge ) ][ Math.round( target.x * this.resolution - nudge ) ];
		const end = targetTile && targetTile.pathable( pathing ) && cache._pathable( minimalTilemap, target.x, target.y ) ?
			targetTile : ( () => {

				const { x, y } = this.nearestPathing( target.x, target.y, entity );
				return this.grid[ Math.floor( ( y - offset ) * this.resolution ) ][ Math.floor( ( x - offset ) * this.resolution ) ];

			} )();
		const realEnd = targetTile === end ? { x: target.x * this.resolution, y: target.y * this.resolution } : end;

		const tag = Math.random();

		// Estimated cost remaining
		// const h = ( a, b ) => Math.abs( b.x - a.x ) + Math.abs( b.y - a.y );
		const h = ( a, b ) => Math.sqrt( ( b.x - a.x ) ** 2 + ( b.y - a.y ) ** 2 );
		const openHeap = new BinaryHeap( node => node.__f );

		let best = start;

		openHeap.push( start );
		start.__dirty = tag;
		// Real cost from start to node
		start.__g = h( realStart, start );
		// Estimated cost remaining
		start.__h = h( start, realEnd );
		// Real cost from start to node plus estimated cost remaining
		start.__f = start.__g + start.__h;
		start.__visited = false;
		start.__closed = false;
		start.__parent = null;

		while ( openHeap.length ) {

			const current = openHeap.pop();

			if ( current === end ) {

				best = end;
				break;

			}

			current.__closed = true;

			const neighbors = current.nodes;

			for ( let i = 0, length = neighbors.length; i < length; i ++ ) {

				const neighbor = neighbors[ i ];

				if ( neighbor.__dirty !== tag ) {

					neighbor.__dirty = tag;
					neighbor.__h = 0;
					neighbor.__f = 0;
					neighbor.__g = 0;
					neighbor.__visited = false;
					neighbor.__closed = false;
					neighbor.__parent = null;

				}

				const wasVisited = neighbor.__visited;

				if ( ! wasVisited )
					if ( neighbor.__closed || ! neighbor.pathable( pathing ) ) continue;
					else if ( ! cache._pathable( minimalTilemap, neighbor.x, neighbor.y ) ) {

						neighbor.__closed = true;
						continue;

					}

				const gScore = current.__g + 1;

				// Line of sight test (this is laggy, so disabled ATM)
				if ( current.__parent && cache._linearPathable( entity, current.__parent, neighbor ) ) {

					const gScore = current.__parent.__g + h( current.__parent, neighbor );
					// First visit or better score than previously known
					if ( ! neighbor.__visited || gScore < neighbor.__g ) {

						neighbor.__visited = true;
						neighbor.__parent = current.__parent;
						neighbor.__h = neighbor.__h || h( neighbor, realEnd );
						neighbor.__g = gScore;
						neighbor.__f = neighbor.__g + neighbor.__h;

						if ( neighbor.__h < best.__h || neighbor.__h === best.__h && neighbor.__g < best.__g )
							best = neighbor;

						if ( ! wasVisited )
							openHeap.push( neighbor );

						else {

							const index = openHeap.indexOf( neighbor );
							if ( index >= 0 ) openHeap.sinkDown( index );

						}

					}

					// First visit or better score than previously known

				} else if ( ! neighbor.__visited || gScore < neighbor.__g ) {

					neighbor.__visited = true;
					neighbor.__parent = current;
					neighbor.__h = neighbor.__h || h( neighbor, realEnd );
					neighbor.__g = gScore;
					neighbor.__f = neighbor.__g + neighbor.__h;

					// if ( target.x === 2.5 && target.y === 1.5 ) debugger;
					if ( neighbor.__h < best.__h || neighbor.__h === best.__h && neighbor.__g < best.__g )
						best = neighbor;

					if ( ! wasVisited )
						openHeap.push( neighbor );

					else {

						const index = openHeap.indexOf( neighbor );
						if ( index >= 0 ) openHeap.sinkDown( index );

					}

				}

			}

		}

		if ( elems ) {

			elems.forEach( elem => document.body.removeChild( elem ) );
			elems.splice( 0 );
			const max = this.grid.reduce( ( max, row ) => row.reduce( ( max, cell ) => Math.max( max, cell.__dirty === tag && cell.__visited ? cell.__f : - Infinity ), max ), - Infinity );
			const min = this.grid.reduce( ( min, row ) => row.reduce( ( min, cell ) => Math.min( min, cell.__dirty === tag && cell.__visited ? cell.__f : Infinity ), min ), Infinity );
			const d = max - min;
			//   0,   0, 255 = 0
			//   0, 255, 255 = 0.25
			//   0, 255,   0 = 0.5
			// 255, 255,   0 = 0.75
			// 255,   0,   0 = 1
			const r = v => v < 0.5 ? 0 : v < 0.75 ? ( v - 0.5 ) * 4 : 1;
			const g = v => v < 0.25 ? v * 4 : v < 0.75 ? 1 : ( 1 - v ) * 4;
			const b = v => v < 0.25 ? 1 : v < 0.5 ? ( 0.5 - v ) * 4 : 0;
			for ( let y = 0; y < this.grid.length; y ++ )
				for ( let x = 0; x < this.grid[ y ].length; x ++ )
					if ( this.grid[ y ][ x ].__dirty === tag && this.grid[ y ][ x ].__visited ) {

						const div = document.createElement( "div" );
						div.style.position = "absolute";
						div.style.top = y * 16 + "px";
						div.style.left = x * 16 + "px";
						div.style.zIndex = 10000;
						div.style.width = "16px";
						div.style.height = "16px";
						const v = ( this.grid[ y ][ x ].__f - min ) / d;
						div.style.background = `rgba(${r( v ) * 255}, ${g( v ) * 255}, ${b( v ) * 255}, 0.5)`;
						div.cell = this.grid[ y ][ x ];
						document.body.appendChild( div );
						elems.push( div );

					}

		}

		const path = [];
		let current = best;

		while ( current ) {

			path.unshift( current );
			current = current.__parent;

		}

		// console.log( "before", path );
		// if ( path.length > 3 ) debugger;
		// this._smooth( entity, path, cache );
		// console.log( "after", path );

		// console.table( Object.entries( cache ).map( ( [ fn, { misses, hits } ] ) => ( {

		// 	fn, misses, hits,

		// } ) ) );

		if ( removed ) this.addEntity( entity );

		const pathWorld = path.map( tile => ( {
			x: this.xTileToWorld( tile.x ) + offset,
			y: this.yTileToWorld( tile.y ) + offset } )
		);

		// We didn't reach the end; pick closest node
		if ( best !== targetTile )
			return [
				...pathWorld[ 0 ].x !== entity.x || pathWorld[ 0 ].y !== entity.y ?
					[ { x: entity.x, y: entity.y } ] :
					[ pathWorld[ 0 ] ],
				...pathWorld.slice( 1 ),
			];

		// We reached the end
		return [
			...pathWorld[ 0 ].x !== entity.x || pathWorld[ 0 ].y !== entity.y ?
				[ { x: entity.x, y: entity.y } ] :
				[ pathWorld[ 0 ] ],
			...pathWorld.slice( 1 ),
			...pathWorld[ pathWorld.length - 1 ].x !== realEnd.x || pathWorld[ pathWorld.length - 1 ].y !== realEnd.y ?
				[ { x: realEnd.x / this.resolution, y: realEnd.y / this.resolution } ] :
				[],
		];

	}

	_smooth( entity, path, cache ) {

		for ( let skip = path.length - 1; skip > 1; skip -- )
			for ( let index = 0; index < path.length - skip; index ++ ) {

				// if ( index === 1 && skip === 2 && entity.radius === 0.5 ) debugger;
				const visible = ( cache || this )._linearPathable( entity, path[ index ], path[ index + skip ] );
				if ( visible ) {

					path.splice( index + 1, skip - 1 );
					skip ++;
					break;

				}

			}

	}

	// Line of sight testing
	// We iterate from start to end by resolution / 2 steps twice; once for x, once for y
	_linearPathable( entity, startTile, endTile, cache = this ) {

		if ( typeof entity.radius !== "number" ) throw new Error( "Can only path find radial entities" );
		const pathing = entity.requiresPathing !== undefined ? entity.requiresPathing : entity.pathing;
		const entityOffset = entity.radius % ( 1 / this.resolution );

		// Assert beginning is pathable
		if ( ! cache._pathable(
			cache.pointToTilemap(
				startTile.x / this.resolution + entityOffset,
				startTile.y / this.resolution + entityOffset,
				entity.radius,
				{ type: pathing, includeOutOfBounds: true }
			),
			startTile.x,
			startTile.y,
		) )
			return false;

		// Assert end is pathable
		if ( ! cache._pathable(
			cache.pointToTilemap(
				endTile.x / this.resolution + entityOffset,
				endTile.y / this.resolution + entityOffset,
				entity.radius,
				{ type: pathing, includeOutOfBounds: true }
			),
			endTile.x,
			endTile.y,
		) )
			return false;

		// Assert the path is pathable
		const tan = Math.abs( ( endTile.x - startTile.x ) / ( endTile.y - startTile.y ) );
		const nudge = Number.EPSILON * entity.radius * this.widthWorld;
		const radius = entity.radius * this.resolution - nudge;

		if ( tan >= - 1 && tan <= 1 ) {

			const yLow = Math.min( startTile.y, endTile.y );
			const yHigh = Math.max( startTile.y, endTile.y );
			const xLow = Math.min( Math.min( startTile.x, endTile.x ) ) - radius + entityOffset;
			const xHigh = Math.max( Math.min( startTile.x, endTile.x ) ) + radius + entityOffset;
			for ( let y = yLow; y <= yHigh; y += 0.5 ) {

				const start = Math.floor( xLow + ( ( y - yLow ) * tan || 0 ) );
				const end = Math.ceil( xHigh + ( ( y - yLow ) * tan || 0 ) );

				if ( Number.isInteger( y ) ) {

					for ( let x = start; x < end && Number.isFinite( x ); x ++ )
						if ( ! this.grid[ y ] || ! this.grid[ y ][ x ] || ! this.grid[ y ][ x ].pathable( pathing ) )
							return false;

				} else {

					for ( let x = start; x < end && Number.isFinite( x ); x ++ )
						if ( ! this.grid[ y - 0.5 ] || ! this.grid[ y - 0.5 ][ x ] || ! this.grid[ y - 0.5 ][ x ].pathable( pathing ) )
							return false;

					for ( let x = start; x < end && Number.isFinite( x ); x ++ )
						if ( ! this.grid[ y + 0.5 ] || ! this.grid[ y + 0.5 ][ x ] || ! this.grid[ y + 0.5 ][ x ].pathable( pathing ) )
							return false;

				}

			}

		} else {

			const tan = Math.abs( ( endTile.y - startTile.y ) / ( endTile.x - startTile.x ) );

			const xLow = Math.min( startTile.x, endTile.x );
			const xHigh = Math.max( startTile.x, endTile.x );
			const yLow = Math.min( Math.min( startTile.y, endTile.y ) ) - radius + entityOffset;
			const yHigh = Math.max( Math.min( startTile.y, endTile.y ) ) + radius + entityOffset;
			for ( let x = xLow; x <= xHigh; x += 0.5 ) {

				const start = Math.floor( yLow + ( ( x - xLow ) * tan || 0 ) );
				const end = Math.ceil( yHigh + ( ( x - xLow ) * tan || 0 ) );

				if ( Number.isInteger( x ) ) {

					for ( let y = start; y < end && Number.isFinite( y ); y ++ )
						if ( ! this.grid[ y ] || ! this.grid[ y ][ x ] || ! this.grid[ y ][ x ].pathable( pathing ) )
							return false;

				} else {

					for ( let y = start; y < end && Number.isFinite( y ); y ++ )
						if ( ! this.grid[ y ] || ! this.grid[ y ][ x - 0.5 ] || ! this.grid[ y ][ x - 0.5 ].pathable( pathing ) )
							return false;

					for ( let y = start; y < end && Number.isFinite( y ); y ++ )
						if ( ! this.grid[ y ] || ! this.grid[ y ][ x + 0.5 ] || ! this.grid[ y ][ x + 0.5 ].pathable( pathing ) )
							return false;

				}

			}

		}

		return true;

	}

	addEntity( entity ) {

		const tiles = [];
		const { map, top, left, width, height } =
			this.pointToTilemap(
				entity.x,
				entity.y,
				entity.radius,
				{
					type: entity.blocksPathing === undefined ?
						entity.pathing :
						entity.blocksPathing,
				}
			);
		const tileX = this.xWorldToTile( entity.x );
		const tileY = this.yWorldToTile( entity.y );
		for ( let y = top; y < top + height; y ++ )
			for ( let x = left; x < left + width; x ++ ) {

				tiles.push( this.grid[ tileY + y ][ tileX + x ] );
				this.grid[ tileY + y ][ tileX + x ].addEntity(
					entity,
					map[ ( y - top ) * width + ( x - left ) ]
				);

			}
		this.entities.set( entity, tiles );

	}

	updateEntity( entity ) {

		const oldTiles = this.entities.get( entity );
		const newTiles = [];
		const { map, top, left, width, height } = this.pointToTilemap(
			entity.x,
			entity.y,
			entity.radius,
			{
				type: entity.blocksPathing === undefined ?
					entity.pathing :
					entity.blocksPathing,
			}
		);
		const tileX = this.xWorldToTile( entity.x );
		const tileY = this.yWorldToTile( entity.y );
		for ( let y = top; y < top + height; y ++ )
			for ( let x = left; x < left + width; x ++ )
				newTiles.push( this.grid[ tileY + y ][ tileX + x ] );

		// Tiles that the entity no longer occupies
		oldTiles.filter( t => ! newTiles.includes( t ) ).forEach( tile =>
			tile.removeEntity( entity ) );

		newTiles.forEach( ( tile, index ) => {

			// Tiles the entity continues to occupy
			if ( oldTiles.includes( tile ) )
				tile.updateEntity(
					entity,
					map[ index ]
				);

			// Tiles the entity now occupies
			else
				tile.addEntity(
					entity,
					map[ index ]
				);

		} );

		this.entities.set( entity, newTiles );

	}

	removeEntity( entity ) {

		const tiles = this.entities.get( entity );
		if ( tiles ) tiles.forEach( tile => tile.removeEntity( entity ) );
		this.entities.delete( entity );

	}

	paint() {

		const host = this.elem || ( this.elem = ( () => {

			const elem = document.createElement( "div" );
			document.getElementById( "arena" ).appendChild( elem );

			return elem;

		} )() );

		host.innerHTML = "";
		const cellSize = 32 / this.resolution;

		for ( let y = 0; y < this.heightMap; y ++ )
			for ( let x = 0; x < this.widthMap; x ++ ) {

				const cell = document.createElement( "div" );
				Object.assign( cell.style, {
					zIndex: 10,
					position: "absolute",
					top: `${y * cellSize}px`,
					left: `${x * cellSize}px`,
					width: `${cellSize}px`,
					height: `${cellSize}px`,
					background: `rgba(${this.grid[ y ][ x ].pathing & 1 ? 255 : 0}, 0, ${this.grid[ y ][ x ].pathing & 2 ? 255 : 0}, 0.4)`,
				} );
				host.appendChild( cell );

			}

	}

}