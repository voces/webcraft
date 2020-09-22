export interface Color {
	index: number;
	name: string;
	hex: string;
	r: number;
	b: number;
	g: number;
	red: number;
	blue: number;
	green: number;
	taken: number;
}

type ColorName =
	| "red"
	| "blue"
	| "cyan"
	| "purple"
	| "yellow"
	| "orange"
	| "lime"
	| "magenta"
	| "grey"
	| "mint"
	| "green"
	| "brown"
	| "maroon"
	| "navy"
	| "olive"
	| "teal"
	| "lavender"
	| "pink"
	| "coral"
	| "beige"
	| "white"
	| "black";

type Colors = Color[] & Record<ColorName, Color>;

const colorsArr: Color[] = [
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
].map((color) => {
	const red = parseInt(color.hex.slice(1, 3), 16);
	const green = parseInt(color.hex.slice(3, 5), 16);
	const blue = parseInt(color.hex.slice(5, 7), 16);
	return { ...color, r: red, g: green, b: blue, red, green, blue, taken: 0 };
});

export const colors: Colors = Object.assign(
	colorsArr,
	...colorsArr.map((c) => ({ [c.name]: c })),
);

export const nextColor = (): Color => {
	const nextColor = colors.find((color) => !color.taken);
	if (!nextColor) throw new Error("ran out of colors");
	return takeColor(nextColor);
};

export const takeColor = (color: Color | number): Color => {
	if (typeof color === "number") color = colors[color];
	color.taken += 1;

	return color;
};

export const releaseColor = (color: Color | number): Color => {
	if (typeof color === "number") color = colors[color];
	color.taken -= 1;

	return color;
};
