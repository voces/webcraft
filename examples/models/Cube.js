
/* exported CubeModel */

class CubeModel extends THREE.Mesh {

	constructor( props = {} ) {

		const scale = props.scale || 1;
		const materialDef = props.materialDef || { color: 0xeeeeff, vertexColors: THREE.FaceColors, shading: THREE.FlatShading };

		if ( props.opacity !== undefined ) {

			materialDef.opacity = props.opacity;
			materialDef.transparent = true;

		}

		if ( materialDef.transparent && materialDef.opacity === undefined ) materialDef.opacity = 1;
		if ( materialDef.opacity !== undefined && ! materialDef.transparent ) materialDef.transparent = true;

		const geometry = new THREE.BoxGeometry( scale, scale, scale );
		const material = new THREE.MeshPhongMaterial( materialDef );

		super( geometry, material );

		this.accentFaces = [ ...Array( geometry.faces.length ).keys() ];

	}

}

CubeModel;
