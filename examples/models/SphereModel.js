
import { Mesh, FaceColors, SphereGeometry, MeshPhongMaterial } from "../../node_modules/three/build/three.module.js";

class SphereModel extends Mesh {

	constructor( props = {} ) {

		const scale = props.scale / 2 || 0.5;
		const color = props.color || 0xeeeeff;
		const materialDef = props.materialDef || { color, vertexColors: FaceColors };

		if ( props.opacity !== undefined ) {

			materialDef.opacity = props.opacity;
			materialDef.transparent = true;

		}

		if ( materialDef.transparent && materialDef.opacity === undefined ) materialDef.opacity = 1;
		if ( materialDef.opacity !== undefined && ! materialDef.transparent ) materialDef.transparent = true;

		const geometry = new SphereGeometry( scale );
		const material = new MeshPhongMaterial( materialDef );

		super( geometry, material );

	}

}

export default SphereModel;
