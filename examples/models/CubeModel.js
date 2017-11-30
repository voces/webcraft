
import { Mesh, FaceColors, BoxGeometry, MeshPhongMaterial } from "../../node_modules/three/build/three.module.js";

class CubeModel extends Mesh {

	constructor( props = {} ) {

		const scale = props.scale || 1;
		const width = ( props.width || 1 ) * scale;
		const height = ( props.height || 1 ) * scale;
		const depth = ( props.depth || 1 ) * scale;
		const color = props.color || 0xeeeeff;

		const materialDef = props.materialDef || { color, vertexColors: FaceColors, flatShading: true };

		if ( props.opacity !== undefined ) {

			materialDef.opacity = props.opacity;
			materialDef.transparent = true;

		}

		if ( materialDef.transparent && materialDef.opacity === undefined ) materialDef.opacity = 1;
		if ( materialDef.opacity !== undefined && ! materialDef.transparent ) materialDef.transparent = true;

		const geometry = new BoxGeometry( width, height, depth );
		const material = new MeshPhongMaterial( materialDef );

		super( geometry, material );

		this.accentFaces = [ ...Array( geometry.faces.length ).keys() ];

	}

}

export default CubeModel;
