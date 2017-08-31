
/* exported CubeModel */

class CubeModel extends THREE.Mesh {

	constructor( props = {} ) {

		const scale = props.scale || 1;
		const width = ( props.width || 1 ) * scale;
		const height = ( props.height || 1 ) * scale;
		const depth = ( props.depth || 1 ) * scale;
		const color = props.color || 0xeeeeff;

		const materialDef = props.materialDef || { color, vertexColors: THREE.FaceColors, flatShading: true };

		if ( props.opacity !== undefined ) {

			materialDef.opacity = props.opacity;
			materialDef.transparent = true;

		}

		if ( materialDef.transparent && materialDef.opacity === undefined ) materialDef.opacity = 1;
		if ( materialDef.opacity !== undefined && ! materialDef.transparent ) materialDef.transparent = true;

		const geometry = new THREE.BoxGeometry( width, height, depth );
		const material = new THREE.MeshPhongMaterial( materialDef );

		super( geometry, material );

		this.accentFaces = [ ...Array( geometry.faces.length ).keys() ];

	}

}

CubeModel;
