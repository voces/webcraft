
import CollectionTest from "./Collection.test.js";
import EventDispatcherTest from "./EventDispatcher.test.js";
import HandleTest from "./Handle.test.js";
import PlayerTest from "./Player.test.js";

export default () => describe( "core", () => {

	CollectionTest();
	EventDispatcherTest();
	HandleTest();
	PlayerTest();

} );
