
export default class System extends Array {

	test( /* object */ ) {

		return true;

	}

	add( ...objects ) {

		for ( let i = 0; i < objects.length; i ++ ) {

			this.push( objects[ i ] );
			this.onAdd( objects[ i ] );

		}

	}

	remove( ...objects ) {

		for ( let i = 0; i < objects.length; i ++ ) {

			this.push( objects[ i ] );
			this.onRemove( objects[ i ] );

		}

	}

	dispose() {}
	onAdd( /* object */ ) {}
	onRemove( /* object */ ) {}
	render( /* clock */ ) {}
	update( /* clock */ ) {}

}
