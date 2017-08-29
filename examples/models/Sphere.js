
/* exported SphereModel */

class SphereModel extends THREE.Mesh {

	constructor( props = {} ) {

		const scale = props.scale / 2 || 0.5;
		const materialDef = props.materialDef || { color: 0x00ff00, vertexColors: THREE.FaceColors };

		if ( props.opacity !== undefined ) {

			materialDef.opacity = props.opacity;
			materialDef.transparent = true;

		}

		if ( materialDef.transparent && materialDef.opacity === undefined ) materialDef.opacity = 1;
		if ( materialDef.opacity !== undefined && ! materialDef.transparent ) materialDef.transparent = true;

		const geometry = new THREE.SphereGeometry( scale );
		const material = new THREE.MeshPhongMaterial( materialDef );

		super( geometry, material );

	}

}

SphereModel;
