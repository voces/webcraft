
export default class BinaryHeap extends Array {

	constructor( scoreFunc ) {

		super();
		this.scoreFunc = scoreFunc;

	}

	push( element ) {

		this.bubbleUp( super.push( element ) - 1 );

	}

	pop() {

		const top = this[ 0 ];
		const bottom = super.pop();

		if ( this.length > 0 ) {

			this[ 0 ] = bottom;
			this.sinkDown( 0 );

		}

		return top;

	}

	remove( element ) {

		const length = this.length;

		for ( let i = 0; i < length; i ++ ) {

			if ( this[ i ] !== element ) continue;

			const bottom = super.pop();

			if ( i === length - 1 ) break;

			this[ i ] = bottom;
			this.bubbleUp( i );
			this.sinkDown( i );

			break;

		}

	}

	bubbleUp( index ) {

		const element = this[ index ];
		const score = this.scoreFunc( element );

		while ( index > 0 ) {

			const parentIndex = Math.floor( ( index + 1 ) / 2 ) - 1,
				parent = this[ parentIndex ];

			if ( score >= this.scoreFunc( parent ) )
				break;

			this[ parentIndex ] = element;
			this[ index ] = parent;

			index = parentIndex;

		}

	}

	sinkDown( index ) {

		const length = this.length;
		const element = this[ index ];
		const score = this.scoreFunc( element );

		while ( true ) {

			const rightIndex = ( index + 1 ) * 2;
			const leftIndex = rightIndex - 1;
			let leftScore;

			let swapIndex = null;

			if ( leftIndex < length ) {

				const left = this[ leftIndex ];
				leftScore = this.scoreFunc( left );

				if ( leftScore < score )
					swapIndex = leftIndex;

			}

			if ( rightIndex < length ) {

				const right = this[ rightIndex ];

				if ( this.scoreFunc( right ) < ( swapIndex === null ? score : leftScore ) )
					swapIndex = rightIndex;

			}

			if ( swapIndex === null ) break;

			this[ index ] = this[ swapIndex ];
			this[ swapIndex ] = element;
			index = swapIndex;

		}

	}

}
