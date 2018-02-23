
import { Mesh, FaceColors, MeshPhongMaterial, JSONLoader } from "../../node_modules/three/build/three.module.js";
import json from "./farm.json.js";

const loader = new JSONLoader();

const colors = [
	0xE7E0B1,	// walls
	0xF1DC3B,	// roof
	0xC89B65,	// door
	0xCB6343,	// chimney
	0x979797,	// chimney-guard
	0x000000 ];	// chimney-top

class FarmModel extends Mesh {

	constructor( { scale = 0.08, color = 0xeeeeff } ) {

		const { geometry } = loader.parse( json );

		for ( let i = 0; i < geometry.faces.length; i ++ )
			geometry.faces[ i ].color.setHex( colors[ geometry.faces[ i ].materialIndex ] );

		geometry.rotateX( Math.PI / 2 );

		const material = new MeshPhongMaterial( { color, vertexColors: FaceColors, flatShading: true } );

		super( geometry, material );
		this.scale.multiplyScalar( scale );
		this.castShadow = true;
		this.receiveShadow = true;

	}

}

export default FarmModel;
