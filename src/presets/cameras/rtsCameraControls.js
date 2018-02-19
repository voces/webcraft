
export default ( camera, renders ) => {

	const keyboard = {};
	let cameraRendering = false;
	const renderCameraMovement = ( time, delta ) => {

		const speed = delta * camera.position.z * 0.001;
		if ( keyboard.ArrowLeft ) camera.position.x -= speed;
		if ( keyboard.ArrowRight ) camera.position.x += speed;
		if ( keyboard.ArrowUp ) camera.position.y += speed;
		if ( keyboard.ArrowDown ) camera.position.y -= speed;

	};
	window.addEventListener( "keydown", e => {

		if ( e.key.indexOf( "Arrow" ) !== 0 ) return;
		if ( keyboard[ e.key ] ) return;
		keyboard[ e.key ] = true;
		if ( cameraRendering ) return;
		cameraRendering = true;
		if ( renders ) renders.add( renderCameraMovement );

	} );
	window.addEventListener( "keyup", e => {

		if ( e.key.indexOf( "Arrow" ) !== 0 ) return;
		keyboard[ e.key ] = false;
		if ( keyboard.ArrowLeft || keyboard.ArrowRight || keyboard.ArrowUp || keyboard.ArrowDown ) return;
		cameraRendering = false;
		if ( renders ) renders.remove( renderCameraMovement );

	} );
	window.addEventListener( "wheel", e => camera.position.z += e.deltaY * 0.01 );

};
