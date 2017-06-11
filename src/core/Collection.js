
class Collection extends Array {

	constructor( ...args ) {

		super( ...args );

		this.key = Collection.defaultKey;
		this.dict = {};

	}

	add( ...items ) {

		this.push( ...items );

		for ( let i = 0; i < items.length; i ++ )
			if ( items[ i ][ this.key ] !== undefined )
				this.dict[ items[ i ][ this.key ] ] = items[ i ];

	}

	replace( arr ) {

		this.splice( 0 );
		this.dict = {};

		this.add( ...arr );

	}

	remove( item ) {

		// console.log( "remove item1", item );

		const index = this.indexOf( item );
		if ( index >= 0 ) this.splice( index, 1 );

		// console.log( "remove item2", item );

		//Is the second condition required? How does it effect speed?
		if ( item[ this.key ] !== undefined && this.dict[ item[ this.key ] ] )
			delete this.dict[ item[ this.key ] ];

	}

}

Collection.defaultKey = "key";

export default Collection;
