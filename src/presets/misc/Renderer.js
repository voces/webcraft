
import { WebGLRenderer, PCFSoftShadowMap } from "../../../node_modules/three/build/three.module.js";

function renderer() {

	const renderer = new WebGLRenderer( { antialias: true } );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = PCFSoftShadowMap;
	renderer.shadowMap.soft = true;

	renderer.setSize( window.innerWidth, window.innerHeight );

	if ( document.readyState === "complete" || document.readyState === "loaded" || document.readyState === "interactive" )
		document.body.appendChild( renderer.domElement );

	else document.addEventListener( "DOMContentLoaded", () => document.body.appendChild( renderer.domElement ) );

	return renderer;

}

export default renderer;
