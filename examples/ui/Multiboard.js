
const supportsHTMLElement = typeof HTMLElement !== "undefined";

class Multiboard extends ( supportsHTMLElement ? HTMLElement : class {} ) {

	constructor( { rows = 1, columns = 1, defaultValue = "", schema, colors = [], data, attach = true } ) {

		super();

		this._data = [];

		this.default = defaultValue;
		this.schema = schema;
		this.colors = colors;
		this.rows = rows;
		this.columns = columns;
		this.data = data;

		if ( attach && supportsHTMLElement ) document.body.appendChild( this );

	}

	connectedCallback() {

		const shadowRoot = this.attachShadow( { mode: "open" } );
		shadowRoot.innerHTML = /* @html */`
			<style>
			:host {
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
			.row {
				display: flex;
				justify-content: space-between;
			}
			.row :not(:empty) { padding: 0.25em 0.25em 0em; }
			</style>
			<div id="container"></div>`;

		const ids = shadowRoot.querySelectorAll( "[id]" );
		for ( let i = 0; i < ids.length; i ++ )
			this[ ids[ i ].id ] = ids[ i ];

	}

	set rows( rows ) {

		while ( this._data.length < rows )
			this._data.push( new Array( this.columns ).fill( this.default ) );

		if ( this._data.length > rows )
			this._data.splice( rows );

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

		if ( ! this.schema ) throw new Error( "Leaderboard must have a schema to use update." );

		if ( ! arr.length ) return;

		if ( arr.length !== this._data.length )
			this.rows = arr.length;

		if ( arr[ 0 ].length !== this._data[ 0 ].length )
			this.columns = arr[ 0 ].length;

		for ( let i = 0; i < arr.length; i ++ )
			if ( arr[ i ] )
				for ( let n = 0; n < this.schema.length; n ++ ) {

					const parts = this.schema[ n ].split( "." );
					let value = arr[ i ][ parts.shift() ];

					while ( parts.length && value ) value = value[ parts.shift() ];

					this._data[ i ][ n ] = value;

				}

		this._render();

	}

	_render() {

		if ( ! supportsHTMLElement || ! this.container ) return;

		for ( let i = 0; i < this._data.length; i ++ ) {

			if ( ! this.container.children[ i ] ) {

				const row = document.createElement( "div" );
				row.classList.add( "row" );
				row.style.color = this.colors[ i ] || "white";
				this.container.appendChild( row );

			} else if ( this.container.children[ i ].style.color !== this.colors[ i ] )
				this.container.children[ i ].style.color = this.colors[ i ] || "white";

			const row = this.container.children[ i ];

			for ( let n = 0; n < this._data[ i ].length; n ++ ) {

				if ( ! row.children[ n ] ) {

					const cell = document.createElement( "span" );
					cell.classList.add( "cell" );
					row.appendChild( cell );

				}

				row.children[ n ].textContent = this._data[ i ][ n ];

			}

		}

		while ( this._data.length < this.container.children.length )
			this.container.removeChild( this.container.lastElementChild );

		while ( this._data[ 0 ].length < this.container.children[ 0 ].length )
			for ( let i = 0; i < this._data.length; i ++ )
				this.container.children[ i ].removeChild( this.container.children[ i ].lastElementChild );

	}

}

if ( typeof customElements !== "undefined" )
	customElements.define( "wc-ui-multiboard", Multiboard );

export default Multiboard;
