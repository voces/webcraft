
class DQuadTree {

	constructor( props = {} ) {

		this.contents = [];
		this.children = undefined;
		this.itemMap = new WeakMap();

		Object.assign( this, {
			density: 10,
			min: { x: - Infinity, y: - Infinity },
			max: { x: Infinity, y: Infinity }
		}, props );

		Object.defineProperties( this, {
			_length: { value: 0, writable: true },
			_sharedMin: { value: { ...this.min }, writable: true },
			_sharedMax: { value: { ...this.max }, writable: true }
		} );

	}

	split() {

		this.x = this.y = 0;

		// Calculate the sum x/y of the cell (clamp each value to the cell)
		for ( let i = 0; i < this.contents.length; i ++ ) {

			this.x += Math.min( Math.max( this.contents[ i ].x, this.min.x ), this.max.x );
			this.y += Math.min( Math.max( this.contents[ i ].y, this.min.y ), this.max.y );

		}

		// Turn that sum into an average
		this.x /= this.contents.length;
		this.y /= this.contents.length;

		this.children = [];

		// Create four children cells (common intersection at the average, as treated below)
		this.children[ 0 ] = new DQuadTree( this.density, this, { x: this.x, y: this.y }, this.max, 0 );
		this.children[ 1 ] = new DQuadTree( this.density, this, { x: this.min.x, y: this.y }, { x: this.x, y: this.max.y }, 1 );
		this.children[ 2 ] = new DQuadTree( this.density, this, this.min, { x: this.x, y: this.y }, 2 );
		this.children[ 3 ] = new DQuadTree( this.density, this, { x: this.x, y: this.min.y }, { x: this.max.x, y: this.y }, 3 );

		// Loop through all the contents and push them onto the new children
		for ( let i = 0; i < this.contents.length; i ++ ) {

			this.contents[ i ][ this.id ].splice( this.contents[ i ][ this.id ].indexOf( this ), 1 );

			if ( this.contents[ i ].max.x > this.x && this.contents[ i ].max.y > this.y )
				this.children[ 0 ].push( this.contents[ i ] );

			if ( this.contents[ i ].min.x < this.x && this.contents[ i ].max.y > this.y )
				this.children[ 1 ].push( this.contents[ i ] );

			if ( this.contents[ i ].min.x < this.x && this.contents[ i ].min.y < this.y )
				this.children[ 2 ].push( this.contents[ i ] );

			if ( this.contents[ i ].max.x > this.x && this.contents[ i ].min.y < this.y )
				this.children[ 3 ].push( this.contents[ i ] );

		}

		this.contents = undefined;

	}

	push( item ) {

		// We've reached density; empty the contents and spill into children
		if ( this.contents && this.contents.length >= this.density && ( this._sharedMax.x - this._sharedMin.x < - 1e-7 || this._sharedMax.y - this._sharedMin.y < - 1e-7 ) )
			this.split();

		// We're not full; add to our own contents
		else if ( ! this.children ) {

			const radius = item.radius || 0;

			// First, update the shared space (used for detecting stacking)
			if ( item.x - radius > this._sharedMin.x ) this._sharedMin.x = item.x - radius;
			if ( item.y - radius > this._sharedMin.y ) this._sharedMin.y = item.y - radius;
			if ( item.x + radius < this._sharedMax.x ) this._sharedMax.x = item.x + radius;
			if ( item.y + radius < this._sharedMax.y ) this._sharedMax.y = item.y + radius;

			// Add to our contents
			this.contents.push( item );

			// Add ourselves as a cell holding the item
			if ( this.itemMap.has( item ) ) this.itemMap.get( item ).push( this );
			else this.itemMap.set( item, [ this ] );

			// Increase our length
			this._length ++;

			return;

		}

		const radius = item.radius || 0;

		// Feeds to a child; find them and push
		if ( item.x + radius > this.x && item.y + radius > this.y ) this.children[ 0 ].push( item );
		if ( item.x - radius < this.x && item.y + radius > this.y ) this.children[ 1 ].push( item );
		if ( item.x - radius < this.x && item.y - radius < this.y ) this.children[ 2 ].push( item );
		if ( item.x + radius > this.x && item.y - radius < this.y ) this.children[ 3 ].push( item );

		// Increase our length
		this._length ++;

	}

	remove( item ) {

		const removedList = [];

		const cells = this.itemMap.get( item );
		if ( ! cells ) {

			for ( let i = 0; i < cells.length; i ++ ) {

				const index = cells[ i ].contents.indexOf( item );

				let cur = cells[ i ];
				while ( cur && removedList.indexOf( cur ) === - 1 ) {

					-- cur.length;
					removedList.push( cur );

					cur = cur.parent;

				}

				cells[ i ].contents.splice( index, 1 );

			}

			for ( let i = 0; i < cells.length; i ++ )
				if ( cells[ i ].contents && cells[ i ].parent && cells[ i ].parent.contents && cells[ i ].parent.length * 1.25 < cells[ i ].density )

					cells[ i ].parent.collapse();

			this.itemMap.delete( item );

		}

	}

	collapse() {

		// Restore the cell as if it was new
		this.contents = [];
		this._sharedMin = { x: this.min.x, y: this.min.y };
		this._sharedMax = { x: this.max.x, y: this.max.y };
		this._length = 0;
		this.x = null;
		this.y = null;

		// Reset the children to empty
		const children = this.children;
		this.children = undefined;

		// Push the contents of all children to this
		for ( let i = 0; i < 4; i ++ ) {

			for ( let n = 0; n < children[ i ].contents.length; n ++ ) {

				const index = children[ i ].contents[ n ][ this.id ].indexOf( children[ i ] );
				if ( index >= 0 ) children[ i ].contents[ n ][ this.id ].splice( index, 1 );

				if ( children[ i ].contents[ n ][ this.id ].indexOf( this ) < 0 )
					this.push( children[ i ].contents[ n ] );

			}

			children[ i ].contents = undefined;

		}

	}

	*queryPoint( x, y, radius ) {

		// Start off the cells with the superstructure
		const cells = [ this ];
		let cell;

		// Loop while non-empty
		while ( ( cell = cells.pop() ) )

			// We have children; add them to cells and try again
			if ( cell.children && cell.children.length > 0 ) {

				if ( x - radius >= cell.x && y - radius >= cell.y ) cells.push( cell.children[ 0 ] );
				if ( x - radius <= cell.x && y - radius >= cell.y ) cells.push( cell.children[ 1 ] );
				if ( x - radius <= cell.x && y - radius <= cell.y ) cells.push( cell.children[ 2 ] );
				if ( x - radius >= cell.x && y - radius <= cell.y ) cells.push( cell.children[ 3 ] );

			// No children; return self

			} else yield cell.contents;

	}

	// Returns
	*queryRange( minX, minY, maxX, maxY ) {

		// Start off the cells with the superstructure
		const cells = [ this ];
		let cell;

		// Loop while non-empty
		while ( ( cell = cells.pop() ) )

			// We have children; add them to cells and try again
			if ( cell.children ) {

				if ( maxX >= cell.x && maxY >= cell.y ) cells.push( cell.children[ 0 ] );
				if ( minX <= cell.x && maxY >= cell.y ) cells.push( cell.children[ 1 ] );
				if ( minX <= cell.x && minY <= cell.y ) cells.push( cell.children[ 2 ] );
				if ( maxX >= cell.x && minY <= cell.y ) cells.push( cell.children[ 3 ] );

			// No children; return self

			} else yield cell.contents;

	}

	*iterateInRange( min, max ) {

		// Start off the cells with the superstructure
		const cells = [ this ];
		const used = new WeakSet();
		let cell;

		// Loop while non-empty
		while ( ( cell = cells.pop() ) )

			// We have children; add them to cells and try again
			if ( cell.children ) {

				if ( max.x >= cell.x && max.y >= cell.y ) cells.push( cell.children[ 0 ] );
				if ( min.x <= cell.x && max.y >= cell.y ) cells.push( cell.children[ 1 ] );
				if ( min.x <= cell.x && min.y <= cell.y ) cells.push( cell.children[ 2 ] );
				if ( max.x >= cell.x && min.y <= cell.y ) cells.push( cell.children[ 3 ] );

			// No children; return self

			} else

				for ( let i = 0; i < cell.contents.length; i ++ )
					if ( used.has( cell.contents[ i ] ) ) continue;
					else {

						used.add( cell.contents[ i ] );
						yield cell.contents[ i ];

					}

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

}

export default DQuadTree;
