
import { BoxGeometry, SphereGeometry, MeshPhongMaterial, Mesh } from "../node_modules/three/build/three.module.js";

export default Object.entries( {
	Box: { geometry: BoxGeometry, material: MeshPhongMaterial },
	Sphere: { geometry: SphereGeometry, material: MeshPhongMaterial }
} ).reduce( ( meshes, [ name, def ] ) => Object.assign( meshes, { [ name ]: class extends Mesh {

	constructor( geometry = [], material = [] ) {

		if ( geometry instanceof Array ) geometry = new def.geometry( ...geometry );
		if ( material instanceof Array ) material = new def.material( ...material );

		super( geometry, material );

		this.name = name;

	}

	static get name() {

		return name;

	}

} } ), {} );
