
export const colors = [
	{ index: 0, name: "red", hex: "#FF0000" },
	{ index: 1, name: "blue", hex: "#4385FF" },
	{ index: 2, name: "cyan", hex: "#64FFFF" },
	{ index: 3, name: "purple", hex: "#820096" },
	{ index: 4, name: "yellow", hex: "#FFEA00" },
	{ index: 5, name: "orange", hex: "#FF9900" },
	{ index: 6, name: "lime", hex: "#BEFF00" },
	{ index: 7, name: "magenta", hex: "#FF00FF" },
	{ index: 8, name: "grey", hex: "#808080" },
	{ index: 9, name: "mint", hex: "#AAFFC3" },
	{ index: 10, name: "green", hex: "#00BE00" },
	{ index: 11, name: "brown", hex: "#AA6E28" },
	{ index: 12, name: "maroon", hex: "#800000" },
	{ index: 13, name: "navy", hex: "#000080" },
	{ index: 14, name: "olive", hex: "#808000" },
	{ index: 15, name: "teal", hex: "#008080" },
	{ index: 16, name: "lavender", hex: "#E6BEFF" },
	{ index: 17, name: "pink", hex: "#FFC9DE" },
	{ index: 18, name: "coral", hex: "#FFD8B1" },
	{ index: 19, name: "beige", hex: "#FFFAC8" },
	{ index: 20, name: "white", hex: "#FFFFFF" },
	{ index: 21, name: "black", hex: "#000000" },
].map( color => {

	const red = parseInt( color.hex.slice( 1, 3 ), 16 );
	const green = parseInt( color.hex.slice( 3, 5 ), 16 );
	const blue = parseInt( color.hex.slice( 5, 7 ), 16 );
	Object.assign( color, { r: red, g: green, b: blue, red, green, blue } );
	return color;

} );

export const next = () => {

	const nextColor = colors.find( color => ! color.taken );
	return take( nextColor );

};

export const take = color => {

	if ( typeof color === "number" ) color = colors[ color ];
	color.taken = ( color.taken || 0 ) + 1;

	return color;

};

export const release = color => {

	if ( typeof color === "number" ) color = colors[ color ];
	color.taken = ( color.taken || 1 ) - 1;

	return color;

};
