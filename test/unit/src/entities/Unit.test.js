
const assert = require( "assert" );

import Doodad from "../../../../src/entities/Doodad.js";
import Unit from "../../../../src/entities/Unit.js";

describe( "Unit", () => {

	it( "Extends Doodad", () => assert.ok( new Unit() instanceof Doodad ) );

} );
