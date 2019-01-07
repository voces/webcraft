
import Doodad from "./Doodad.js";
import meshes from "../meshes.js";
import { merge } from "../../node_modules/knack-ecs/src/util.js";

export default Object.entries( {
	Box: { model: "Box" },
	Sphere: { model: "Sphere" }
} ).map( ( [ name, data ] ) => {

	if ( data.model ) data.model = new meshes[ data.model ]();

	return [ name, data ];

} ).reduce( ( types, [ name, data ] ) => Object.assign( types, { [ name ]: class extends Doodad {

	static get defaultData() {

		console.log( `${name}#defaultData`, { ...Doodad.defaultData, data } );
		return merge( Doodad.defaultData, data );

	}

	static get name() {

		return name;

	}

} } ), {} );
