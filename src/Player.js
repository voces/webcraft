
import EventDispatcher from "./util/EventDispatcher.js";

export default class Player extends EventDispatcher {

	id;
	name;
	color;

	constructor( { id, name, color } ) {

		super();

		if ( id === undefined ) throw new Error( "id must be provided" );
		this.id = id;

		this.name = name || id;

		if ( color ) this.color = color;

	}

}

