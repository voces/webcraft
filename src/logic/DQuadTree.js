
const defaultCalculateBoundingBox = item => {

	const radius = item.radius || 0;
	return {
		min: { x: item.x - radius, y: item.y - radius },
		max: { x: item.x + radius, y: item.y + radius }
	};

};

// From https://stackoverflow.com/a/402010
const circleIntersectsRect = ( centerX, centerY, radius, rect ) => {

	const itemX = ( rect.min.x + rect.max.x ) / 2;
	const itemY = ( rect.min.y + rect.max.y ) / 2;
	const itemHalfWidth = ( rect.max.x - rect.min.x ) / 2;
	const itemHalfHeight = ( rect.max.y - rect.min.y ) / 2;

	const distX = Math.abs( centerX - itemX );
	const distY = Math.abs( centerY - itemY );

	if ( distX > itemHalfWidth + radius ) return false;
	if ( distY > itemHalfHeight + radius ) return false;

	if ( distX <= itemHalfWidth ) return true;
	if ( distY <= itemHalfHeight ) return true;

	const distSqd = ( distX - itemHalfWidth ) ** 2 + ( distY - itemHalfHeight ) ** 2;

	return distSqd <= radius ** 2;

};

class Children extends Array {

	constructor( qt ) {

		super();

		const childProps = qt.getChildProps();

		// Create four child quadtrees (common intersection at the average, as treated below)
		this.topRight = new DQuadTree( { ...childProps, _min: { x: qt.x, y: qt.y }, _max: { ...qt._max }, _path: `${qt.path}.topRight` } );
		this.topLeft = new DQuadTree( { ...childProps, _min: { x: qt._min.x, y: qt.y }, _max: { x: qt.x, y: qt._max.y }, _path: `${qt.path}.topLeft` } );
		this.botLeft = new DQuadTree( { ...childProps, _min: { ...qt._min }, _max: { x: qt.x, y: qt.y }, _path: `${qt.path}.botLeft` } );
		this.botRight = new DQuadTree( { ...childProps, _min: { x: qt.x, y: qt._min.y }, _max: { x: qt._max.x, y: qt.y }, _path: `${qt.path}.botRight` } );

	}

	get topRight() {

		return this[ 0 ];

	}

	set topRight( value ) {

		return this[ 0 ] = value;

	}

	get topLeft() {

		return this[ 1 ];

	}

	set topLeft( value ) {

		return this[ 1 ] = value;

	}

	get botLeft() {

		return this[ 2 ];

	}

	set botLeft( value ) {

		return this[ 2 ] = value;

	}

	get botRight() {

		return this[ 3 ];

	}

	set botRight( value ) {

		return this[ 3 ] = value;

	}

}

export default class DQuadTree {

	static get defaultCalculateBoundingBox() {

		return defaultCalculateBoundingBox;

	}

	// A multiple of #density, so we don't constantly split/collapse
	static get densityThrash() {

		return 1.25;

	}

	constructor( { density, calculateBoundingBox, _min, _max, _path, _itemMap, _parent } = {} ) {

		Object.defineProperties( this, {
			density: { value: density || 10, enumerable: true },
			calculateBoundingBox: { value: calculateBoundingBox || this.constructor.defaultCalculateBoundingBox, enumerable: true },
			path: { value: _path || "root", enumerable: true },
			_min: { value: _min || { x: - Infinity, y: - Infinity } },
			_max: { value: _max || { x: Infinity, y: Infinity } },
			_length: { value: 0, writable: true },
			_itemMap: { value: _itemMap || new WeakMap() },
			_children: { value: undefined, writable: true },
			_contents: { value: [], writable: true },
			_parent: { value: _parent }
		} );

		Object.defineProperties( this, {
			_sharedMin: { value: { ...this._min }, writable: true },
			_sharedMax: { value: { ...this._max }, writable: true }
		} );

	}

	getChildProps() {

		return {
			density: this.density,
			_itemMap: this._itemMap,
			_parent: this
		};

	}

	split() {

		this.x = this.y = 0;

		// Calculate the sum x/y of the cell (clamp each value to the cell)
		for ( let i = 0; i < this._contents.length; i ++ ) {

			this.x += Math.min( Math.max( this._contents[ i ].x, this._min.x ), this._max.x );
			this.y += Math.min( Math.max( this._contents[ i ].y, this._min.y ), this._max.y );

		}

		// Turn that sum into an average
		this.x /= this._contents.length;
		this.y /= this._contents.length;

		// console.log( "split at", this.x, this.y );

		this._children = new Children( this );

		// Loop through all the contents and push them onto the new children
		for ( let i = 0; i < this._contents.length; i ++ ) {

			// Remove from current cell
			const cells = this._itemMap.get( this._contents[ i ] );
			cells.splice( cells.indexOf( this ), 1 );

			if ( this._contents[ i ].id === undefined )
				debugger;

			const boundingBox = this.calculateBoundingBox( this._contents[ i ] );
			// Push to subdivisions
			if ( boundingBox.max.x >= this.x && boundingBox.max.y >= this.y )
				this._children.topRight.push( this._contents[ i ] );
				// console.log( "adding", this._contents[ i ].id, "topRight" );

			if ( boundingBox.min.x <= this.x && boundingBox.max.y >= this.y )
				this._children.topLeft.push( this._contents[ i ] );
				// console.log( "adding", this._contents[ i ].id, "topLeft" );

			if ( boundingBox.min.x <= this.x && boundingBox.min.y <= this.y )
				this._children.botLeft.push( this._contents[ i ] );
				// console.log( "adding", this._contents[ i ].id, "botLeft" );

			if ( boundingBox.max.x >= this.x && boundingBox.min.y <= this.y )
				this._children.botRight.push( this._contents[ i ] );
				// console.log( "adding", this._contents[ i ].id, "botRight" );

		}

		this._contents = undefined;

	}

	push( item ) {

		// Increase our length
		this._length ++;

		// We've reached density; empty the contents and spill into children
		if ( this._contents && this._contents.length >= this.density && ( this._sharedMax.x - this._sharedMin.x < - 1e-7 || this._sharedMax.y - this._sharedMin.y < - 1e-7 ) )

			// console.log( "splitting", this._sharedMax.x - this._sharedMin.x, this._sharedMax.y - this._sharedMin.y );
			this.split();

		// We're not full; add to our own contents
		else if ( ! this._children ) {

			const boundingBox = this.calculateBoundingBox( item );

			// First, update the shared space (used for detecting stacking)
			if ( boundingBox.min.x > this._sharedMin.x ) this._sharedMin.x = boundingBox.min.x;
			if ( boundingBox.min.y > this._sharedMin.y ) this._sharedMin.y = boundingBox.min.y;
			if ( boundingBox.max.x < this._sharedMax.x ) this._sharedMax.x = boundingBox.max.x;
			if ( boundingBox.max.y < this._sharedMax.y ) this._sharedMax.y = boundingBox.max.y;

			// Add to our contents
			this._contents.push( item );

			// Add ourselves as a cell holding the item
			// TODO: _itemMap should be shared between parent and children!!!
			if ( this._itemMap.has( item ) ) this._itemMap.get( item ).push( this );
			else this._itemMap.set( item, [ this ] );

			return;

		}

		const boundingBox = this.calculateBoundingBox( item );

		// Feeds to a child; find them and push
		if ( boundingBox.max.x >= this.x && boundingBox.max.y >= this.y ) this._children.topRight.push( item );
		if ( boundingBox.min.x <= this.x && boundingBox.max.y >= this.y ) this._children.topLeft.push( item );
		if ( boundingBox.min.x <= this.x && boundingBox.min.y <= this.y ) this._children.botLeft.push( item );
		if ( boundingBox.max.x >= this.x && boundingBox.min.y <= this.y ) this._children.botRight.push( item );

	}

	remove( item ) {

		const cells = this._itemMap.get( item );
		if ( ! cells ) return;

		for ( let i = 0; i < cells.length; i ++ ) {

			const index = cells[ i ]._contents.indexOf( item );

			let cur = cells[ i ];
			while ( cur ) {

				-- cur._length;
				cur = cur._parent;

			}

			cells[ i ]._contents.splice( index, 1 );

		}

		for ( let i = 0; i < cells.length; i ++ )
			// TODO: expose this 1.25 somewhere
			if ( cells[ i ]._parent && cells[ i ]._parent.length * this.constructor.densityThrash < this.density )
				cells[ i ]._parent.collapse();

		this._itemMap.delete( item );

	}

	update( item ) {

		// Check if changed
		const cells = this._itemMap.get( item );
		if ( ! cells ) {

			console.log( "no cells, pushing", item.id );
			return this.push( item );

		}
		let minX = Infinity;
		let minY = Infinity;
		let maxX = - Infinity;
		let maxY = - Infinity;
		for ( let i = 0; i < cells.length; i ++ ) {

			if ( cells[ i ]._min.x < minX ) minX = cells[ i ]._min.x;
			if ( cells[ i ]._min.y < minY ) minY = cells[ i ]._min.y;
			if ( cells[ i ]._max.x > maxX ) maxX = cells[ i ]._max.x;
			if ( cells[ i ]._max.y > maxY ) maxY = cells[ i ]._max.y;

		}

		const boundingBox = this.calculateBoundingBox( item );

		if ( boundingBox.min.x >= minX && boundingBox.min.y >= minY &&
			boundingBox.max.x <= maxX && boundingBox.max.y <= maxY )

			return;

		// Otherwise re-add
		this.remove( item );
		this.push( item );

	}

	collapse() {

		// Restore the cell as if it was new
		this._contents = [];
		this._sharedMin = { ...this._min };
		this._sharedMax = { ...this._max };
		this._length = 0;
		delete this.x;
		delete this.y;

		// Reset the children to empty
		const children = this._children;
		this._children = undefined;

		// Push the contents of all children to this
		for ( let i = 0; i < 4; i ++ ) {

			for ( let n = 0; n < children[ i ]._contents.length; n ++ ) {

				const cells = this._itemMap.get( children[ i ]._contents[ n ] );
				const index = cells.indexOf( children[ i ] );
				if ( index >= 0 ) cells.splice( index, 1 );

				if ( cells.indexOf( this ) < 0 )
					this.push( children[ i ]._contents[ n ] );

			}

			children[ i ]._contents = undefined;

		}

	}

	_queryPoint( x, y, radius ) {

		return this.queryRange( x - radius, y.radius, x + radius, y + radius );

	}

	// Returns
	*_queryRange( minX, minY, maxX, maxY ) {

		// Start off the cells with the superstructure
		const cells = [ this ];
		let cell;

		// Loop while non-empty
		while ( ( cell = cells.pop() ) )

			// We have children; add them to cells and try again
			if ( cell._children ) {

				if ( maxX >= cell.x && maxY >= cell.y )
					cells.push( cell._children.topRight );
				if ( minX <= cell.x && maxY >= cell.y )
					cells.push( cell._children.topLeft );
				if ( minX <= cell.x && minY <= cell.y )
					cells.push( cell._children.botLeft );
				if ( maxX >= cell.x && minY <= cell.y )
					cells.push( cell._children.botRight );

			// No children; return self

			} else yield cell._contents;

	}

	*_iterateInRangeRadius( centerX, centerY, radius ) {

		// Start off the cells with the superstructure
		const yielded = new Set();

		for ( const items of this._queryRange( centerX - radius, centerY - radius, centerX + radius, centerY + radius ) )
			for ( let i = 0; i < items.length; i ++ )

				if ( yielded.has( items[ i ] ) ) continue;
				else {

					// TODO: benchmark this assumption
					// We're marking it yielded if we don't because it's expensive to calculate
					yielded.add( items[ i ] );
					if ( circleIntersectsRect( centerX, centerY, radius, this.calculateBoundingBox( items[ i ] ) ) )
						yield items[ i ];

				}

	}

	// Can accept:
	// 1) min: {x, y}, max: {x, y}
	// 2) minX, minY, maxX, maxY
	// 3) center: {x, y}, radius
	// 4) centerX, centerY, radius
	// 5) {centerX, centerY, radius}
	// 6) min: {x, y}, maxX, maxY (please don't do this...)
	// 7) minX, minY, max: {x, y} (please don't do this...)
	// TODO: Add support for {min: {x, y}, max: {x, y}}
	*iterateInRange( mixedArg, minY, maxX, maxY ) {

		let minX = mixedArg;

		// First argument is point-like
		if ( typeof minX !== "number" ) {

			maxY = maxX;
			maxX = minY;
			minY = minX.y;
			minX = minX.x;

		}

		// one arg, either maxX is a point or radius
		if ( maxY === undefined )

			// maxX is a radius, so generate min/max from it
			if ( typeof maxX === "number" || maxX === undefined ) {

				const radius = typeof maxX === "number" ? maxX : mixedArg.radius || 0;
				yield* this._iterateInRangeRadius( minX, minY, radius );
				return;

			// It's point-like

			} else {

				maxY = maxX.y;
				maxX = maxX.x;

			}

		// Start off the cells with the superstructure
		const yielded = new Set();

		for ( const items of this._queryRange( minX, minY, maxX, maxY ) )
			for ( let i = 0; i < items.length; i ++ )
				if ( yielded.has( items[ i ] ) ) continue;
				else {

					const boundingBox = this.calculateBoundingBox( items[ i ] );
					if ( boundingBox.min.x >= minX && boundingBox.min.y >= minY &&
					boundingBox.max.x <= maxX && boundingBox.max.y <= maxY ) {

						yielded.add( items[ i ] );
						yield items[ i ];

					}

				}

	}

	enumerateInRange( ...args ) {

		return Array.from( this.iterateInRange( ...args ) );

	}

	get length() {

		return this._length;

	}

	get overlap() {

		return {
			x: this._sharedMax.x - this._sharedMin.x,
			y: this._sharedMax.y - this._sharedMin.y
		};

	}

	[Symbol.iterator]() {

		return this.iterateInRange( this._min, this._max );

	}

	_breadthCells( fn ) {

		let cells = [ this ];
		let rounds = 0;
		while ( cells.length ) {

			const newCells = [];
			cells.forEach( cell => {

				fn( cell, rounds );
				if ( cell._children ) newCells.push( ...cell._children );

			} );

			cells = newCells;
			rounds ++;

		}

	}

}
