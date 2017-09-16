
const isBrowser = new Function( "try {return this===window;}catch(e){ return false;}" )();

class Multiboard {

	constructor( { rows = 1, columns = 1, defaultValue = "", schema, colors = [], data } ) {

		this._data = [];

		this.default = defaultValue;
		this.schema = schema;
		this.colors = colors;
		this.rows = rows;
		this.columns = columns;
		this.data = data;

	}

	set rows( rows ) {

		while ( this._data.length < rows )
			this._data.push( new Array( this.columns ).fill( this.default ) );

		this._render();

	}

	set columns( columns ) {

		while ( this._data[ 0 ].length < columns )
			for ( let i = 0; i < this._data.length; i ++ )
				this._data[ i ].push( this.default );

		this._render();

	}

	set( row, column, value ) {

		this._data[ row ][ column ] = value;

		this._render();

	}

	update( arr ) {

		if ( ! this.schema ) throw "Leaderboard must have a schema to use update.";

		if ( arr.length !== this._data.length )
			this.rows = arr.length;

		if ( arr[ 0 ].length !== this._data[ 0 ].length )
			this.columns = arr[ 0 ].length;

		for ( let i = 0; i < arr.length; i ++ )
			if ( arr[ i ] )
				for ( let n = 0; n < this.schema.length; n ++ ) {

					let parts = this.schema[ n ].split( "." );
					let value = arr[ i ][ parts.shift() ];

					while ( parts.length && value ) value = value[ parts.shift() ];

					this._data[ i ][ n ] = value;

				}

		this._render();

	}

	_render() {

		if ( ! isBrowser ) return;

		if ( ! this._container ) {

			const e = document.createElement( "div" );
			e.classList.add( "wc", "ui-multiboard", "container" );

			this._container = e;

			document.body.appendChild( e );

		}

		for ( let i = 0; i < this._data.length; i ++ ) {

			if ( ! this._container.children[ i ] ) {

				const row = document.createElement( "div" );
				row.classList.add( "row" );
				row.style.color = this.colors[ i ] || "white";
				this._container.appendChild( row );

			}

			const row = this._container.children[ i ];

			for ( let n = 0; n < this._data[ i ].length; n ++ ) {

				if ( ! row.children[ n ] ) {

					const cell = document.createElement( "span" );
					cell.classList.add( "cell" );
					row.appendChild( cell );

				}

				row.children[ n ].textContent = this._data[ i ][ n ];

			}

		}

		while ( this._data.length > this._container.children.length )
			this._container.removeChild( this._container.children[ this._container.children.length - 1 ] );

		while ( this._data[ 0 ].length > this._container.children[ 0 ].length )
			for ( let i = 0; i < this._data.length; i ++ )
				this._container.children[ i ].removeChild( this._container.children[ i ].children[ this._container.children[ i ].children.length - 1 ] );

	}

}

if ( ! isBrowser ) module.exports = Multiboard;
else {

	const style = document.createElement( "style" );
	style.innerText = `
		.wc.ui-multiboard.container {
			font-size: 1.5em;
			color: white;
			position: absolute;
			right: 1em;
			top: 0.5em;
			background-color: rgba(0, 0, 0, 0.5);
			border: 1px outset gold;
			border-radius: 0.25em;
			box-shadow: 0 0 0.25em black;
			z-index: 1;
		}
		.wc.ui-multiboard.container .row {
			display: flex;
			justify-content: space-between;
		}
		.wc.ui-multiboard.container .row :not(:empty) { padding: 0 0.5em; }
	`;

	document.head.appendChild( style );

}
