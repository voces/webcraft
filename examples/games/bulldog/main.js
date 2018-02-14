
import chat from "../../ui/chat.js";
import * as WebCraft from "../../../src/webcraft.js";

// delayed import
const di = path => () => import( path );

///////////////////////////////////////////////
/// Initialization
//////////////////////////////////////////////

const SIZE = 0.5;

const app = new WebCraft.App( {

	network: { host: "notextures.io", port: 8086 },

	terrain: {
		tileTypes: [
			{ name: "Grass", color: "#608038" },
			{ name: "Sand", color: "#C2B280" },
			{ name: "Rock", color: "#708090" }
		],
		tilemap: [
			"00000000",
			"00000000",
			"00000000",
			"00000010",
			"00000121",
			"00000221",
			"00000110"
		],
		heightmap: [
			"00000000",
			"01111110",
			"01111110",
			"01111110",
			"01111130",
			"01111240",
			"00000000"
		].map( row => row.split( "" ).map( v => parseInt( v ) ) )
	},

	types: {
		doodads: [
			{ name: "Green", model: { mesh: di( "../../models/CubeModel.js" ), color: "#B5FEB4" } },
			{ name: "TileWhite", model: { mesh: di( "../../models/CubeModel.js" ), color: "#F7F7FF" } },
			{ name: "TileGray", model: { mesh: di( "../../models/CubeModel.js" ), color: "#E6E6FF" } }
		],
		units: [
			{ name: "Character", model: { mesh: di( "../../models/CubeModel.js" ), scale: SIZE }, speed: 3.5 },
			{ name: "Food", model: { mesh: di( "../../models/SphereModel.js" ), color: "#FFFF00", scale: 0.5 }, state: [ "food" ] },
			{ name: "Enemy", model: { mesh: di( "../../models/SphereModel.js" ), color: "#0000FF", scale: 0.5 }, speed: 7 }
		]
	}
} );

app.state = { players: app.players, units: app.units, doodads: app.doodads, levelIndex: 0 };

if ( WebCraft.isBrowser ) chat( app );

/////////////////////////////////////////////////
///// Game Logic
/////////////////////////////////////////////////

/////////////////////////////////////////////////
///// Server Events
/////////////////////////////////////////////////

/////////////////////////////////////////////////
///// Player Actions
/////////////////////////////////////////////////

/////////////////////////////////////////////////
///// Levels
/////////////////////////////////////////////////

/////////////////////////////////////////////////
///// Misc
/////////////////////////////////////////////////

export default app;

if ( typeof window === "object" ) window.app = app;
