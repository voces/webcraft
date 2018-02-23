
import { SkinnedMesh, JSONLoader } from "../../node_modules/three/build/three.module.js";
import json from "./sheep.json.js";

const loader = new JSONLoader();

class SheepModel extends SkinnedMesh {

	constructor( { scale = 0.08 } ) {

		const { geometry, materials } = loader.parse( json );

		geometry.rotateX( Math.PI / 2 );

		materials.forEach( mat => mat.skinning = true );

		super( geometry, materials );
		this.scale.multiplyScalar( scale );
		this.castShadow = true;
		this.receiveShadow = true;
		this.material.skinning = true;

	}

}

export default SheepModel;
