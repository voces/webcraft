
function renderer() {

	const renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	renderer.setSize( window.innerWidth, window.innerHeight );

	if ( document.readyState === "complete" || document.readyState === "loaded" || document.readyState === "interactive" )
		document.body.appendChild( renderer );

	else document.addEventListener( "DOMContentLoaded", () => document.body.appendChild( renderer.domElement ) );

	return renderer;

}

export default renderer;
