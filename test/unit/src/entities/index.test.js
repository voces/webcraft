
/* globals describe */

import DoodadTest from "./Doodad.test.js";
import TerrainTest from "./Terrain.test.js";
import UnitTest from "./Unit.test.js";

export default () => describe( "entities", () => {

	DoodadTest();
	TerrainTest();
	UnitTest();

} );
