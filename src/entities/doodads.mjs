
import { merge } from "../../node_modules/knack-ecs/src/util.mjs";

import Doodad from "./Doodad.mjs";
import meshes from "../meshes.mjs";

export default Object.entries( {
	Box: { model: "Box" },
	Sphere: { model: "Sphere" }
} ).map( ( [ name, data ] ) => {

	if ( data.model ) data.model = new meshes[ data.model ]();

	return [ name, data ];

} ).reduce( ( types, [ name, data ] ) => Object.assign( types, { [ name ]: class extends Doodad {

	static get defaultData() {

		return merge( Doodad.defaultData, data );

	}

	static get name() {

		return name;

	}

} } ), {} );
