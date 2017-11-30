
import coreTest from "./core/index.test.js";
import entitiesTest from "./entities/index.test.js";

export default () => describe( "src", () => {

	coreTest();
	entitiesTest();

} );
