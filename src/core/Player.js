
import Handle from "./Handle.js";

class Player extends Handle {

	constructor( props = {} ) {

		props.status = "here";

		super( props );

		if ( this.entityType === Player )
			Object.assign( this, { color: Player.getNextColor() }, props );

	}

	static getNextColor() {

		let i = 0;
		while ( i < Player.colors.length && Player.colors[ i ].taken )
			i ++;

		if ( i === Player.colors.length )
			console.error( "This is awkward" );

		return i;

	}

	get key() {

		return "p" + this.id;

	}

	set key( key ) {

		this.id = parseInt( key.slice( 1 ) );

	}

	get color() {

		return this._props.color;

	}

	set color( color ) {

		if ( typeof color === "number" ) color = Player.colors[ color ];
		else if ( typeof color === "string" ) color = Player.colors.find( c => c.name === color || c.hex === color );
		else return;

		if ( ! color ) return;

		if ( this._props.color ) this._props.color.taken = false;

		this._props.color = color;
		this._props.color.taken = true;

	}

	remove() {

		if ( this.color ) this.color.taken = false;
		this.status = "removed";

		super.remove();

	}

	toState() {

		return Object.assign( super.toState(), {
			_constructor: this.constructor.name,
			color: Player.colors.indexOf( this.color ),
			status: this.status
		} );

	}

}

Player.colors = [
    { name: "red", hex: "#FF0000" },
    { name: "blue", hex: "#4385FF" },
    { name: "cyan", hex: "#64FFFF" },
    { name: "purple", hex: "#820096" },
    { name: "yellow", hex: "#FFEA00" },
    { name: "orange", hex: "#FF9900" },
    { name: "lime", hex: "#BEFF00" },
    { name: "magenta", hex: "#FF00FF" },
    { name: "grey", hex: "#808080" },
    { name: "mint", hex: "#AAFFC3" },
    { name: "green", hex: "#00BE00" },
    { name: "brown", hex: "#AA6E28" },
    { name: "maroon", hex: "#800000" },
    { name: "navy", hex: "#000080" },
    { name: "olive", hex: "#808000" },
    { name: "teal", hex: "#008080" },
    { name: "lavender", hex: "#E6BEFF" },
    { name: "pink", hex: "#FFC9DE" },
    { name: "coral", hex: "#FFD8B1" },
    { name: "beige", hex: "#FFFAC8" },
    { name: "white", hex: "#FFFFFF" },
    { name: "black", hex: "#000000" }
];

Handle.entityTypes.push( Player );

export default Player;
