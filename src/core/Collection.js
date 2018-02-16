
class Collection extends Array {

	constructor( ...args ) {

		super( ...args );

		this.key = Collection.defaultKey;
		this.dict = {};

	}

	add( ...items ) {

		for ( let i = 0; i < items.length; i ++ )

			if ( items[ i ][ this.key ] !== undefined ) {

				if ( this.dict[ items[ i ][ this.key ] ] === items[ i ] ) continue;

				this.dict[ items[ i ][ this.key ] ] = items[ i ];
				this.push( items[ i ] );

			} else if ( ! this.includes( items[ i ] ) ) this.push( items[ i ] );

	}

	remove( item ) {

		const index = this.indexOf( item );
		if ( index >= 0 ) this.splice( index, 1 );

		//Is the second condition required? How does it effect speed?
		if ( item[ this.key ] !== undefined && this.dict[ item[ this.key ] ] )
			delete this.dict[ item[ this.key ] ];

	}

}

Collection.defaultKey = "key";

export default Collection;
