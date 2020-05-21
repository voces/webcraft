
import BinaryHeap from "./BinaryHeap.js";
import memoize from "./memoize.js";
import { DIRECTION, PATHING_TYPES } from "../constants.js";
import { document } from "../util/globals.js";

let debugging = false;
const elems = [];
const arena = document.getElementById( "arena" );
export const toggleDebugging = () => {

	if ( debugging )
		elems.forEach( elem => arena.removeChild( elem ) );

	debugging = ! debugging;

};

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

//   0,   0, 255 = 0
//   0, 255, 255 = 0.25
//   0, 255,   0 = 0.5
// 255, 255,   0 = 0.75
// 255,   0,   0 = 1
const r = v => v < 0.5 ? 0 : v < 0.75 ? ( v - 0.5 ) * 4 : 1;
const g = v => v < 0.25 ? v * 4 : v < 0.75 ? 1 : ( 1 - v ) * 4;
const b = v => v < 0.25 ? 1 : v < 0.5 ? ( 0.5 - v ) * 4 : 0;

const placeTile = ( x, y, v ) => {

	const div = document.createElement( "div" );
	div.style.position = "absolute";
	div.style.top = y * 16 + "px";
	div.style.left = x * 16 + "px";
	div.style.zIndex = 10000;
	div.style.width = "16px";
	div.style.height = "16px";
	div.style.background = `rgba(${r( v ) * 255}, ${g( v ) * 255}, ${b( v ) * 255}, 0.5)`;
	// div.cell = this.grid[ y ][ x ];
	arena.appendChild( div );
	elems.push( div );

};

// eslint-disable-next-line no-unused-vars
export default class Tilemap {

	// Maps entities to tiles
	entities = new Map()

	constructor( { pathing, resolution = DEFAULT_RESOLUTION, layers } ) {

		this.resolution = resolution;

		this.layers = layers;

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

			}

	}

	_pathable( map, xTile, yTile, test ) {

		if ( xTile < 0 || yTile < 0 || xTile >= this.widthMap || yTile >= this.heightMap )
			return false;

		let i = 0;

		for ( let y = yTile + map.top; y < yTile + map.height + map.top; y ++ )
			for ( let x = xTile + map.left; x < xTile + map.width + map.left; x ++, i ++ )
				if (
					this.grid[ y ] === undefined ||
					this.grid[ y ][ x ] === undefined ||
					this.grid[ y ][ x ].pathing & map.map[ i ] ||
					test && ! test( this.grid[ y ][ x ] )
				)

					return false;

		return true;

	}

	pathable( entity, xWorld, yWorld ) {

		if ( xWorld === undefined ) xWorld = entity.x;
		if ( yWorld === undefined ) yWorld = entity.y;

		const xTile = this.xWorldToTile( xWorld );
		const yTile = this.yWorldToTile( yWorld );
		const map = entity.requiresTilemap || this.pointToTilemap(
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

	nearestPathing( xWorld, yWorld, entity, test ) {

		const xTile = Math.max( Math.min( Math.round( xWorld * this.resolution ), this.widthMap - 1 ), 0 );
		const yTile = Math.max( Math.min( Math.round( yWorld * this.resolution ), this.heightMap - 1 ), 0 );

		// If initial position is fine, push it
		if ( this._pathable(
			entity.requiresTilemap || this.pointToTilemap(
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
			yTile,
			test
		) )
			return { x: xWorld, y: yWorld };

		// Calculate input from non-entity input
		const target = { x: xWorld, y: yWorld };

		// Calculate constants from entity
		const pathing = entity.requiresPathing === undefined ?
			entity.pathing :
			entity.requiresPathing;
		const minimalTilemap = entity.requiresTilemap || this.pointToTilemap(
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
		const heap = new BinaryHeap( node => node.__np );

		// Seed our heap
		const start = this.grid[ yTile ][ xTile ];
		start.__npTag = tag;
		start.__np = distance( target, offset( start.world ) );
		heap.push( start );

		// Find a node!
		while ( heap.length ) {

			const current = heap.pop();

			if (
				current.pathable( pathing ) &&
				this._pathable( minimalTilemap, current.x, current.y, test )
			)

				return offset( current.world );

			current.nodes.forEach( neighbor => {

				if ( neighbor.__npTag === tag ) return;
				neighbor.__npTag = tag;
				neighbor.__np = distance( target, offset( neighbor.world ) );

				heap.push( neighbor );

			} );

		}

		// Found nothing, return input
		return { x: xWorld, y: yWorld };

	}

	_layer( xTile, yTile ) {

		if ( ! this.layers ) return;
		if ( yTile < 0 ) return;

		xTile = Math.floor( xTile / this.resolution );
		yTile = Math.floor( yTile / this.resolution );

		if ( this.layers.length <= yTile ) return;
		return this.layers[ yTile ][ xTile ];

	}

	layer( xWorld, yWorld ) {

		if ( ! this.layers ) return;
		if ( yWorld < 0 ) return;

		xWorld = Math.floor( xWorld );
		yWorld = Math.floor( yWorld );

		if ( this.layers.length <= yWorld ) return;
		return this.layers[ yWorld ][ xWorld ];

	}

	nearestSpiralPathing(
		xWorld,
		yWorld,
		entity,
		layer = this.layer( xWorld, yWorld )
	) {

		const originalX = xWorld;
		const originalY = yWorld;

		let xTile = this.xWorldToTile( xWorld );
		let yTile = this.yWorldToTile( yWorld );

		let attemptLayer = this._layer( xTile, yTile );

		if ( layer === attemptLayer )
			if ( entity.structure ) {

				if ( this._pathable( entity.requiresTilemap, xTile, yTile ) )
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
					DIRECTION.LEFT :
					DIRECTION.RIGHT :
				yMiss < 0.5 && yMiss > 0 ?
					DIRECTION.UP :
					DIRECTION.DOWN;

		let steps = 0;
		const stride = entity.structure ? 2 : 1;
		let initialSteps = 0;

		let remainingTries = MAX_TRIES;

		let minimalTilemap;
		let offset;
		if ( entity.requiresTilemap ) {

			minimalTilemap = entity.requiresTilemap;
			offset = {
				x: entity.requiresTilemap.left / this.resolution,
				y: entity.requiresTilemap.top / this.resolution,
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
			layer !== undefined && attemptLayer !== layer
		) {

			if ( ! remainingTries -- ) return { x: originalX, y: originalY };

			switch ( direction ) {

				case DIRECTION.DOWN: yTile += stride; break;
				case DIRECTION.RIGHT: xTile += stride; break;
				case DIRECTION.UP: yTile -= stride; break;
				case DIRECTION.LEFT: xTile -= stride; break;

			}

			if ( this.grid[ yTile ] && this.grid[ yTile ][ xTile ] )
				tried.push( this.grid[ yTile ][ xTile ] );

			if ( steps === 0 ) {

				steps = initialSteps;
				if ( direction === 0 || direction === 2 ) initialSteps ++;
				direction = ( direction + 1 ) % 4;

			} else steps --;

			attemptLayer = this._layer( xTile, yTile );

		}

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

	yBoundTile( yIndex ) {

		return Math.max( Math.min( yIndex, this.heightMap - 1 ), 0 );

	}

	xBoundTile( xIndex ) {

		return Math.max( Math.min( xIndex, this.widthMap - 1 ), 0 );

	}

	// Adapted from https://github.com/bgrins/javascript-astar/blob/master/astar.js
	// towards Theta*
	// This gets really sad when a path is not possible
	path( entity, target ) {

		if ( typeof entity.radius !== "number" ) throw new Error( "Can only path find radial entities" );

		const cache = {
			_linearPathable: memoize( ( ...args ) => this._linearPathable( ...args, cache ) ),
			_pathable: memoize( ( ...args ) => this._pathable( ...args ) ),
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
		// We can assume start is pathable
		const startReal = { x: entity.x * this.resolution, y: entity.y * this.resolution };
		const startTile = this.grid[ this.yBoundTile( Math.round( entity.y * this.resolution - nudge ) ) ][ this.xBoundTile( Math.round( entity.x * this.resolution - nudge ) ) ];
		// For target, if the exact spot is pathable, we aim towards that; otherwise the nearest spot
		const targetTile = this.grid[ this.yBoundTile( Math.round( target.y * this.resolution - nudge ) ) ][ this.xBoundTile( Math.round( target.x * this.resolution - nudge ) ) ];
		const targetPathable = targetTile &&
			targetTile.pathable( pathing ) &&
			this.pathable( entity, target.x, target.y );
		const endTile = targetPathable ?
			targetTile :
			( () => {

				const { x, y } = this.nearestPathing( target.x, target.y, entity );
				return this.grid[ Math.round( ( y - offset ) * this.resolution ) ][ Math.round( ( x - offset ) * this.resolution ) ];

			} )();
		const endReal = targetPathable ?
			{ x: target.x * this.resolution, y: target.y * this.resolution } :
			endTile;

		// If we start and end on the same tile, just move between them
		if ( startTile === endTile && this.pathable( entity ) ) {

			if ( removed ) this.addEntity( entity );
			return [
				{ x: entity.x, y: entity.y },
				{ x: endReal.x / this.resolution, y: endReal.y / this.resolution },
			];

		}

		// Estimated cost remaining
		const h = ( a, b ) => Math.sqrt( ( b.x - a.x ) ** 2 + ( b.y - a.y ) ** 2 );

		const startHeap = new BinaryHeap( node => node.__startRealPlusEstimatedCost );
		const startTag = Math.random();
		let startBest = startTile;
		startHeap.push( startTile );
		startTile.__startTag = startTag;
		startTile.__startRealCostFromOrigin = h( startReal, startTile );
		startTile.__startEstimatedCostRemaining = h( startTile, endReal );
		startTile.__startRealPlusEstimatedCost = startTile.__startEstimatedCostRemaining + startTile.__startRealCostFromOrigin;
		startTile.__startVisited = false;
		startTile.__startClosed = false;
		startTile.__startParent = null;

		const endHeap = new BinaryHeap( node => node.__endRealPlusEstimatedCost );
		const endTag = Math.random();
		let endBest = endTile;
		endHeap.push( endTile );
		endTile.__endTag = endTag;
		endTile.__endRealCostFromOrigin = h( endReal, endTile );
		endTile.__endEstimatedCostRemaining = h( endTile, startReal );
		endTile.__endRealPlusEstimatedCost = endTile.__endEstimatedCostRemaining + endTile.__endRealCostFromOrigin;
		endTile.__endVisited = false;
		endTile.__endClosed = false;
		endTile.__endParent = null;

		let checksSinceBestChange = 0;
		while ( startHeap.length ) {

			// Degenerate case: target is close to start, but ~blocked off
			if ( checksSinceBestChange ++ > 2500 ) break;

			// Start to End
			const startCurrent = startHeap.pop();

			if ( startCurrent === endTile ) {

				startBest = endTile;
				break;

			} else if ( startCurrent.__endTag === endTag ) {

				startBest = endBest = startCurrent;
				break;

			}

			startCurrent.__startClosed = true;

			const startNeighbors = startCurrent.nodes;

			for ( let i = 0, length = startNeighbors.length; i < length; i ++ ) {

				const neighbor = startNeighbors[ i ];

				if ( neighbor.__startTag !== startTag ) {

					neighbor.__startTag = startTag;
					neighbor.__startEstimatedCostRemaining = 0;
					neighbor.__startRealPlusEstimatedCost = 0;
					neighbor.__startRealCostFromOrigin = 0;
					neighbor.__startVisited = false;
					neighbor.__startClosed = false;
					neighbor.__startParent = null;

				}

				const wasVisited = neighbor.__startVisited;

				if ( ! wasVisited )
					if ( neighbor.__startClosed || ! neighbor.pathable( pathing ) ) continue;
					else if ( ! cache._pathable( minimalTilemap, neighbor.x, neighbor.y ) ) {

						neighbor.__startClosed = true;
						continue;

					}

				const gScore = startCurrent.__startRealCostFromOrigin + 1;

				// Line of sight test (this is laggy, so disabled ATM)
				if ( startCurrent.__startParent && cache._linearPathable( entity, startCurrent.__startParent, neighbor, cache ) ) {

					const gScore = startCurrent.__startParent.__startRealCostFromOrigin + h( startCurrent.__startParent, neighbor );
					// First visit or better score than previously known
					if ( ! neighbor.__startVisited || gScore < neighbor.__startRealCostFromOrigin ) {

						neighbor.__startVisited = true;
						neighbor.__startParent = startCurrent.__startParent;
						neighbor.__startEstimatedCostRemaining = neighbor.__startEstimatedCostRemaining || h( neighbor, endReal );
						neighbor.__startRealCostFromOrigin = gScore;
						neighbor.__startRealPlusEstimatedCost = neighbor.__startRealCostFromOrigin + neighbor.__startEstimatedCostRemaining;

						if ( neighbor.__startEstimatedCostRemaining < startBest.__startEstimatedCostRemaining || neighbor.__startEstimatedCostRemaining === startBest.__startEstimatedCostRemaining && neighbor.__startRealCostFromOrigin < startBest.__startRealCostFromOrigin ) {

							startBest = neighbor;
							checksSinceBestChange = 0;

						}

						if ( ! wasVisited )
							startHeap.push( neighbor );

						else {

							const index = startHeap.indexOf( neighbor );
							if ( index >= 0 ) startHeap.sinkDown( index );

						}

					}

					// First visit or better score than previously known

				} else if ( ! neighbor.__startVisited || gScore < neighbor.__startRealCostFromOrigin ) {

					neighbor.__startVisited = true;
					neighbor.__startParent = startCurrent;
					neighbor.__startEstimatedCostRemaining = neighbor.__startEstimatedCostRemaining || h( neighbor, endReal );
					neighbor.__startRealCostFromOrigin = gScore;
					neighbor.__startRealPlusEstimatedCost = neighbor.__startRealCostFromOrigin + neighbor.__startEstimatedCostRemaining;

					if ( neighbor.__startEstimatedCostRemaining < startBest.__startEstimatedCostRemaining || neighbor.__startEstimatedCostRemaining === startBest.__startEstimatedCostRemaining && neighbor.__startRealCostFromOrigin < startBest.__startRealCostFromOrigin ) {

						startBest = neighbor;
						checksSinceBestChange = 0;

					}

					if ( ! wasVisited )
						startHeap.push( neighbor );

					else {

						const index = startHeap.indexOf( neighbor );
						if ( index >= 0 ) startHeap.sinkDown( index );

					}

				}

			}

			// End to Start

			if ( ! endHeap.length ) {

				const { x, y } = this.nearestPathing( target.x, target.y, entity, tile => tile.__endTag !== endTag );
				const newEndtile = this.grid[ Math.round( ( y - offset ) * this.resolution ) ][ Math.round( ( x - offset ) * this.resolution ) ];

				endBest = newEndtile;
				endHeap.push( newEndtile );
				newEndtile.__endTag = endTag;
				newEndtile.__endRealCostFromOrigin = h( endReal, newEndtile );
				newEndtile.__endEstimatedCostRemaining = h( newEndtile, startReal );
				newEndtile.__endRealPlusEstimatedCost = newEndtile.__endEstimatedCostRemaining + newEndtile.__endRealCostFromOrigin;
				newEndtile.__endVisited = false;
				newEndtile.__endClosed = false;
				newEndtile.__endParent = null;

			}

			const endCurrent = endHeap.pop();

			if ( endCurrent === startTile ) {

				endBest = startTile;
				break;

			} else if ( endCurrent.__startTag === startTag ) {

				startBest = endBest = endCurrent;
				break;

			}

			endCurrent.__endClosed = true;

			const endNeighbors = endCurrent.nodes;

			for ( let i = 0, length = endNeighbors.length; i < length; i ++ ) {

				const neighbor = endNeighbors[ i ];

				if ( neighbor.__endTag !== endTag ) {

					neighbor.__endTag = endTag;
					neighbor.__endEstimatedCostRemaining = 0;
					neighbor.__endRealPlusEstimatedCost = 0;
					neighbor.__endRealCostFromOrigin = 0;
					neighbor.__endVisited = false;
					neighbor.__endClosed = false;
					neighbor.__endParent = null;

				}

				const wasVisited = neighbor.__endVisited;

				if ( ! wasVisited )
					if ( neighbor.__endClosed || ! neighbor.pathable( pathing ) ) continue;
					else if ( ! cache._pathable( minimalTilemap, neighbor.x, neighbor.y ) ) {

						neighbor.__endClosed = true;
						continue;

					}

				const gScore = endCurrent.__endRealCostFromOrigin + 1;

				// Line of sight test (this is laggy, so disabled ATM)
				if ( endCurrent.__endParent && cache._linearPathable( entity, endCurrent.__endParent, neighbor, cache ) ) {

					const gScore = endCurrent.__endParent.__endRealCostFromOrigin + h( endCurrent.__endParent, neighbor );
					// First visit or better score than previously known
					if ( ! neighbor.__endVisited || gScore < neighbor.__endRealCostFromOrigin ) {

						neighbor.__endVisited = true;
						neighbor.__endParent = endCurrent.__endParent;
						neighbor.__endEstimatedCostRemaining = neighbor.__endEstimatedCostRemaining || h( neighbor, startReal );
						neighbor.__endRealCostFromOrigin = gScore;
						neighbor.__endRealPlusEstimatedCost = neighbor.__endRealCostFromOrigin + neighbor.__endEstimatedCostRemaining;

						if ( neighbor.__endEstimatedCostRemaining < endBest.__endEstimatedCostRemaining || neighbor.__endEstimatedCostRemaining === endBest.__endEstimatedCostRemaining && neighbor.__endRealCostFromOrigin < endBest.__endRealCostFromOrigin ) {

							endBest = neighbor;
							checksSinceBestChange = 0;

						}

						if ( ! wasVisited )
							endHeap.push( neighbor );

						else {

							const index = endHeap.indexOf( neighbor );
							if ( index >= 0 ) endHeap.sinkDown( index );

						}

					}

					// First visit or better score than previously known

				} else if ( ! neighbor.__endVisited || gScore < neighbor.__endRealCostFromOrigin ) {

					neighbor.__endVisited = true;
					neighbor.__endParent = endCurrent;
					neighbor.__endEstimatedCostRemaining = neighbor.__endEstimatedCostRemaining || h( neighbor, startReal );
					neighbor.__endRealCostFromOrigin = gScore;
					neighbor.__endRealPlusEstimatedCost = neighbor.__endRealCostFromOrigin + neighbor.__endEstimatedCostRemaining;

					if ( neighbor.__endEstimatedCostRemaining < endBest.__endEstimatedCostRemaining || neighbor.__endEstimatedCostRemaining === endBest.__endEstimatedCostRemaining && neighbor.__endRealCostFromOrigin < endBest.__endRealCostFromOrigin ) {

						endBest = neighbor;
						checksSinceBestChange = 0;

					}

					if ( ! wasVisited )
						endHeap.push( neighbor );

					else {

						const index = endHeap.indexOf( neighbor );
						if ( index >= 0 ) endHeap.sinkDown( index );

					}

				}

			}

		}

		if ( debugging ) {

			elems.forEach( elem => arena.removeChild( elem ) );
			elems.splice( 0 );
			const max = this.grid.reduce( ( max, row ) =>
				row.reduce( ( max, cell ) => Math.max( max, cell.__startTag === startTag && cell.__startVisited ? cell.__startRealPlusEstimatedCost : cell.__endTag === endTag && cell.__endVisited ? cell.__endRealPlusEstimatedCost : - Infinity ), max ), - Infinity );
			const min = this.grid.reduce( ( min, row ) =>
				row.reduce( ( min, cell ) => Math.min( min, cell.__startTag === startTag && cell.__startVisited ? cell.__startRealPlusEstimatedCost : cell.__endTag === endTag && cell.__endVisited ? cell.__endRealPlusEstimatedCost : Infinity ), min ), Infinity );
			const d = max - min;
			for ( let y = 0; y < this.grid.length; y ++ )
				for ( let x = 0; x < this.grid[ y ].length; x ++ )
					if ( this.grid[ y ][ x ].__startTag === startTag && this.grid[ y ][ x ].__startVisited || this.grid[ y ][ x ].__endTag === endTag && this.grid[ y ][ x ].__endVisited )
						placeTile( x, y, ( ( this.grid[ y ][ x ].__startTag === startTag ? this.grid[ y ][ x ].__startRealPlusEstimatedCost : this.grid[ y ][ x ].__endRealPlusEstimatedCost ) - min ) / d );

		}

		const path = [];
		let startCurrent = startBest;
		while ( startCurrent ) {

			path.unshift( startCurrent );
			startCurrent = startCurrent.__startParent;

		}
		if ( startBest === endBest ) {

			let endCurrent = startBest.__endParent;
			while ( endCurrent ) {

				path.push( endCurrent );
				endCurrent = endCurrent.__endParent;

			}

		}

		this._smooth( entity, path, cache );

		if ( removed ) this.addEntity( entity );

		const pathWorld = path.map( tile => ( {
			x: this.xTileToWorld( tile.x ) + offset,
			y: this.yTileToWorld( tile.y ) + offset } )
		);

		// We didn't reach the end; pick closest node
		const last = path[ path.length - 1 ];
		if ( last !== targetTile )
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
			...pathWorld[ pathWorld.length - 1 ].x !== endReal.x / this.resolution || pathWorld[ pathWorld.length - 1 ].y !== endReal.y / this.resolution ?
				[ { x: endReal.x / this.resolution, y: endReal.y / this.resolution } ] :
				[],
		];

	}

	_smooth( entity, path, cache = this ) {

		for ( let skip = path.length - 1; skip > 1; skip -- )
			for ( let index = 0; index < path.length - skip; index ++ )
				if ( cache._linearPathable( entity, path[ index ], path[ index + skip ], cache ) ) {

					path.splice( index + 1, skip - 1 );
					skip = path.length;
					break;

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
		const tan = ( endTile.x - startTile.x ) / ( endTile.y - startTile.y );
		const nudge = Number.EPSILON * entity.radius * this.widthWorld;
		const radius = entity.radius * this.resolution - nudge;

		if ( tan >= - 1 && tan <= 1 ) {

			const yLow = Math.min( startTile.y, endTile.y );
			const yHigh = Math.max( startTile.y, endTile.y );
			const xStart = startTile.y < endTile.y ? startTile.x : endTile.x;
			const xLow = xStart - radius + entityOffset;
			const xHigh = xStart + radius + entityOffset;

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

			const tan = ( endTile.y - startTile.y ) / ( endTile.x - startTile.x );

			const xLow = Math.min( startTile.x, endTile.x );
			const xHigh = Math.max( startTile.x, endTile.x );
			const yStart = startTile.x < endTile.x ? startTile.y : endTile.y;
			const yLow = yStart - radius + entityOffset;
			const yHigh = yStart + radius + entityOffset;

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
			entity.blocksTilemap || this.pointToTilemap(
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

		const oldTiles = this.entities.get( entity ) || [];
		const newTiles = [];
		const { map, top, left, width, height } =
			entity.blocksTilemap || this.pointToTilemap(
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

	paintMap( map, xTile, yTile ) {

		const host = this.elem || ( this.elem = ( () => {

			const elem = document.createElement( "div" );
			document.getElementById( "arena" ).appendChild( elem );

			return elem;

		} )() );

		const cellSize = 32 / this.resolution;

		let i = 0;

		for ( let y = yTile + map.top; y < yTile + map.height + map.top; y ++ )
			for ( let x = xTile + map.left; x < xTile + map.width + map.left; x ++, i ++ ) {

				const cell = document.createElement( "div" );
				Object.assign( cell.style, {
					zIndex: 10,
					position: "absolute",
					top: `${y * cellSize}px`,
					left: `${x * cellSize}px`,
					width: `${cellSize}px`,
					height: `${cellSize}px`,
					background:
						this.grid[ y ] === undefined ||
						this.grid[ y ][ x ] === undefined ||
						this.grid[ y ][ x ].pathing & map.map[ i ]
							? "rgba(255,0,0,0.5)" : "rgba(0,255,0,0.5)",
				} );
				cell.setAttribute( "x", x );
				cell.setAttribute( "y", y );
				cell.setAttribute( "i", i );
				cell.setAttribute( "grid", this.grid[ y ] === undefined ? "no-y" : this.grid[ y ][ x ] === undefined ? "no-x" : this.grid[ y ][ x ].pathing );
				cell.setAttribute( "map", map.map[ i ] );
				host.appendChild( cell );

			}

	}

}
