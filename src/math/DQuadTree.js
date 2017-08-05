
import geometry from "geometry.js";

class DQuadTree {

	constructor( props = {} ) {

		this.contents = [];
		this.children = undefined;

		Object.assign( this, {
			density: 10,
			min: { x: - Infinity, y: - Infinity },
			max: { x: - Infinity, y: - Infinity }
		}, props );

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
		if ( this.contents && this.contents.length >= this.density && ( this.sharedMax.x - this.sharedMin.x < - 1e-7 || this.sharedMax.y - this.sharedMin.y < - 1e-7 ) )
			this.split();

		// We're not full; add to our own contents
		else if ( ! this.children ) {

			// First, update the shared space (used for detecting stacking)
			if ( item.min.x > this.sharedMin.x ) this.sharedMin.x = item.min.x;
			if ( item.min.y > this.sharedMin.y ) this.sharedMin.y = item.min.y;
			if ( item.max.x < this.sharedMax.x ) this.sharedMax.x = item.max.x;
			if ( item.max.y < this.sharedMax.y ) this.sharedMax.y = item.max.y;

			// Add to our contents
			this.contents.push( item );

			// Add ourselves as a cell holding the item
			if ( item[ this.id ] ) item[ this.id ].push( this );
			else item[ this.id ] = [ this ];

			// /Increase our length
			++ this.length;

			return;

		}

		// Feeds to a child; find them and push
		if ( item.max.x > this.x && item.max.y > this.y ) this.children[ 0 ].push( item );
		if ( item.min.x < this.x && item.max.y > this.y ) this.children[ 1 ].push( item );
		if ( item.min.x < this.x && item.min.y < this.y ) this.children[ 2 ].push( item );
		if ( item.max.x > this.x && item.min.y < this.y ) this.children[ 3 ].push( item );

		// Increase our length
		++ this.length;

	}

	remove( item ) {

		const removedList = [];

		if ( typeof item[ this.id ] !== "undefined" ) {

			for ( let i = 0; i < item[ this.id ].length; i ++ ) {

				const index = item[ this.id ][ i ].contents.indexOf( item );

				let cur = item[ this.id ][ i ];
				while ( cur && removedList.indexOf( cur ) === - 1 ) {

					-- cur.length;
					removedList.push( cur );

					cur = cur.parent;

				}

				item[ this.id ][ i ].contents.splice( index, 1 );

			}

			for ( let i = 0; i < item[ this.id ].length; i ++ )
				if ( item[ this.id ][ i ].contents && item[ this.id ][ i ].parent && item[ this.id ][ i ].parent.contents && item[ this.id ][ i ].parent.length * 1.25 < item[ this.id ][ i ].density )

					item[ this.id ][ i ].parent.collapse();

			item[ this.id ] = undefined;

		}

	}

	collapse() {

		// Restore the cell as if it was new
		this.contents = [];
		this.sharedMin = { x: this.min.x, y: this.min.y };
		this.sharedMax = { x: this.max.x, y: this.max.y };
		this.length = 0;
		this.x = null;
		this.y = null;

		// Reset the children to empty
		const children = this.children;
		this.children = undefined;

		// Push the contents of all children to this
		for ( let i = 0; i < 4; i ++ ) {

			for ( let n = 0; n < children[ i ].contents.length; n ++ ) {

				let index = children[ i ].contents[ n ][ this.id ].indexOf( children[ i ] );
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
		while ( cell = cells.pop() )

			// We have children; add them to cells and try again
			if ( cell.children && cell.children.length > 0 ) {

				if ( x - radius >= cell.x && y - radius >= cell.y ) cells.push( cell.children[ 0 ] );
				if ( x - radius <= cell.x && y - radius >= cell.y ) cells.push( cell.children[ 1 ] );
				if ( x - radius <= cell.x && y - radius <= cell.y ) cells.push( cell.children[ 2 ] );
				if ( x - radius >= cell.x && y - radius <= cell.y ) cells.push( cell.children[ 3 ] );

			// No children; return self

			} else yield cell.contents;

	}

	*queryRange( minX, minY, maxX, maxY, radius ) {

		// Start off the cells with the superstructure
		const cells = [ this ];
		let cell;

		// Loop while non-empty
		while ( cell = cells.pop() )

			// We have children; add them to cells and try again
			if ( cell.children ) {

				if ( maxX + radius >= cell.x && maxY + radius >= cell.y ) cells.push( cell.children[ 0 ] );
				if ( minX - radius <= cell.x && maxY + radius >= cell.y ) cells.push( cell.children[ 1 ] );
				if ( minX - radius <= cell.x && minY - radius <= cell.y ) cells.push( cell.children[ 2 ] );
				if ( maxX + radius >= cell.x && minY - radius <= cell.y ) cells.push( cell.children[ 3 ] );

			// No children; return self

			} else yield cell.contents;

	}

	*iterateInRange( min, max ) {

		// Start off the cells with the superstructure
		const cells = [ this ];
		const used = new WeakSet();
		let cell;

		// Loop while non-empty
		while ( cell = cells.pop() )

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

	// TODO: investigate if I can split this or simplify it without performance hit
	*queryLine( x1, y1, x2, y2 ) {

		const cells = [ this ];
		const lineAngle = Math.atan2( y2 - y1, x2 - x1 );

		let testAngle, cell;

		// Going down towards the right
		if ( lineAngle >= 0 && lineAngle <= Math.PI / 2 ) {

			while ( cell = cells.pop() )

				// Children, push those that apply (with the nearest pushed last)
				if ( cell.children.length > 0 ) {

					testAngle = Math.atan2( cell.y - y1, cell.x - x1 );

					// Bottom right
					if ( x2 >= cell.x && y2 >= cell.y && geometry.inclusiveBetween( lineAngle, Math.atan2( cell.y - y1, cell.max.x - x1 ), Math.atan2( cell.max.y - y1, cell.x - x1 ) ) )
						cells.push( cell.children[ 0 ] );

					// Top right
					if ( x2 >= cell.x && lineAngle <= testAngle || y1 <= cell.y )
						cells.push( cell.children[ 3 ] );

					// Bottom left
					if ( y2 >= cell.y && lineAngle >= testAngle || x1 <= cell.x )
						cells.push( cell.children[ 1 ] );

					// Top left
					if ( x1 <= cell.x && y1 <= cell.y && geometry.inclusiveBetween( lineAngle, Math.atan2( cell.min.y - y1, cell.x - x1 ), Math.atan2( cell.y - y1, cell.min.x - x1 ) ) )
						cells.push( cell.children[ 2 ] );

				// No children, give it

				} else if ( cell.contents.length ) yield cell.contents;

		// Going down towards the left

		} else if ( lineAngle >= Math.PI / 2 && lineAngle <= Math.PI ) {

			while ( cell = cells.pop() )

				// Children, push those that apply (with the nearest pushed last)
				if ( cell.children.length > 0 ) {

					testAngle = Math.atan2( cell.y - y1, cell.x - x1 );

					// Bottom left
					if ( x2 <= cell.x && y2 >= cell.y && geometry.inclusiveBetween( lineAngle, Math.atan2( cell.max.y - y1, cell.x - x1 ), Math.atan2( cell.y - y1, cell.min.x - x1 ) ) )
						cells.push( cell.children[ 1 ] );

					// Top left
					if ( x2 <= cell.x && lineAngle >= testAngle || y1 <= cell.y )
						cells.push( cell.children[ 2 ] );

					// Bottom right
					if ( y2 >= cell.y && lineAngle <= testAngle || x1 >= cell.x )
						cells.push( cell.children[ 0 ] );

					// Top right
					if ( x1 >= cell.x && y1 <= cell.y && geometry.inclusiveBetween( lineAngle, Math.atan2( cell.y - y1, cell.max.x - x1 ), Math.atan2( cell.min.y - y1, cell.x - x1 ) ) )
						cells.push( cell.children[ 3 ] );

				// No children, give it

				} else if ( cell.contents.length ) yield cell.contents;

		// Going up towards the left

		} else if ( lineAngle >= - Math.PI && lineAngle <= Math.PI / - 2 ) {

			while ( cell = cells.pop() )

				// Children, push those that apply (with the nearest pushed last)
				if ( cell.children.length > 0 ) {

					testAngle = Math.atan2( cell.y - y1, cell.x - x1 );

					// Top left
					if ( x2 <= cell.x && y2 <= cell.y && geometry.inclusiveBetween( lineAngle, Math.atan2( cell.y - y1, cell.min.x - x1 ), Math.atan2( cell.min.y - y1, cell.x - x1 ) ) )
						cells.push( cell.children[ 2 ] );

					// Top right
					if ( y2 <= cell.y && lineAngle >= testAngle || x1 >= cell.x )
						cells.push( cell.children[ 3 ] );

					// Bottom left
					if ( x2 <= cell.x && lineAngle <= testAngle || y1 >= cell.y )
						cells.push( cell.children[ 1 ] );

					// Bottom right
					if ( x1 >= cell.x && y1 >= cell.y && geometry.inclusiveBetween( lineAngle, Math.atan2( cell.max.y - y1, cell.x - x1 ), Math.atan2( cell.y - y1, cell.max.x - x1 ) ) )
						cells.push( cell.children[ 0 ] );

				// No children, give it

				} else if ( cell.contents.length ) yield cell.contents;

		// Going up towards the right

		} else if ( lineAngle >= Math.PI / - 2 && lineAngle <= 0 )

			while ( cell = cells.pop() )

				// Children, push those that apply (with the nearest pushed last)
				if ( cell.children.length > 0 ) {

					testAngle = Math.atan2( cell.y - y1, cell.x - x1 );

					// Top right
					if ( x2 >= cell.x && y2 <= cell.y && geometry.inclusiveBetween( lineAngle, Math.atan2( cell.min.y - y1, cell.x - x1 ), Math.atan2( cell.y - y1, cell.max.x - x1 ) ) )
						cells.push( cell.children[ 3 ] );

					// Top left
					if ( y2 <= cell.y && lineAngle <= testAngle || x1 <= cell.x )
						cells.push( cell.children[ 2 ] );

					// Bottom right
					if ( x2 >= cell.x && lineAngle >= testAngle || y1 >= cell.y )
						cells.push( cell.children[ 0 ] );

					// Bottom left
					if ( x1 <= cell.x && y1 >= cell.y && geometry.inclusiveBetween( lineAngle, Math.atan2( cell.y - y1, cell.min.x - x1 ), Math.atan2( cell.max.y - y1, cell.x - x1 ) ) )
						cells.push( cell.children[ 1 ] );

				// No children, give it

				} else if ( cell.contents.length ) yield cell.contents;

	}

}

export default DQuadTree;
