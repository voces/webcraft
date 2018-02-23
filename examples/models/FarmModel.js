
import { BoxGeometry, Mesh, FaceColors, MeshPhongMaterial, JSONLoader } from "../../node_modules/three/build/three.module.js";

const loader = new JSONLoader();

const colors = [
	0xE7E0B1,	// walls
	0xF1DC3B,	// roof
	0xC89B65,	// door
	0xCB6343,	// chimney
	0x979797,	// chimney-guard
	0x000000 ];	// chimney-top

let geometry, material;
const ready = new Promise( resolve => loader.load( "/examples/models/farm.json", ( geo, mat ) => {

	geo.rotateX( Math.PI / 2 );
	geo.scale( 0.08, 0.08, 0.08 );

	for ( let i = 0; i < geo.faces.length; i ++ )
		geo.faces[ i ].color.setHex( colors[ geo.faces[ i ].materialIndex ] );

	geometry = geo;
	material = mat;

	resolve( { geo, mat } );

} ) );

class FarmModel extends Mesh {

	constructor( props = {} ) {

		const color = props.color || 0xeeeeff;

		const materialDef = props.materialDef || { color, vertexColors: FaceColors, flatShading: true };

		if ( props.opacity !== undefined ) {

			materialDef.opacity = props.opacity;
			materialDef.transparent = true;

		}

		if ( materialDef.transparent && materialDef.opacity === undefined ) materialDef.opacity = 1;
		if ( materialDef.opacity !== undefined && ! materialDef.transparent ) materialDef.transparent = true;

		const geo = geometry || new BoxGeometry( 1, 1, 1 );
		const mat = material || new MeshPhongMaterial( materialDef );

		super( geo, mat );
		this.castShadow = true;
		this.receiveShadow = true;

		if ( geometry ) return;
		ready.then( ( { geo/*, mat*/ } ) => {

			this.geometry = geo;
			// this.material = mat;
			this.accentFaces = [ ...Array( geo.faces.length ).keys() ];

		} );

	}

}

export default FarmModel;
