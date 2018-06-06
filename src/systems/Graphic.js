
import System from "../../node_modules/knack-ecs/src/System.js";
import { DirectionalLight, PCFSoftShadowMap, PerspectiveCamera, Scene, WebGLRenderer } from "../../node_modules/three/build/three.module.js";

import { isBrowser } from "../util.js";

export default class Graphic extends System {

	constructor() {

		super();

		Object.defineProperties( this, {
			_queuedAdds: { value: [] },
			onObject3D: { value: this.onObject3D.bind( this ) }
		} );

		this.addEventListener( "entityadded", this.onEntityAdded.bind( this ) );
		this.addEventListener( "entityremoved", this.onEntityRemoved.bind( this ) );
		this.addEventListener( "sceneready", this.onSceneReady.bind( this ) );

		const width = isBrowser ? window.innerWidth : 1920;
		const height = isBrowser ? window.innerHeight : 1080;

		this.scene = new Scene();

		this.camera = new PerspectiveCamera( 50, width / height, 0.1, 10000 );
		this.camera.position.z = 25;
		this.scene.add( this.camera );

		this.sun = new DirectionalLight();
		this.sun.position.set( - 10, - 15, 25 );
		this.sun.shadow.camera.near = 0;
		this.sun.shadow.camera.far = 100;
		this.sun.shadow.camera.left = - 2 * 18;
		this.sun.shadow.camera.right = 2 * 18;
		this.sun.shadow.camera.top = 2 * 9;
		this.sun.shadow.camera.bottom = - 2 * 9;
		this.sun.shadow.mapSize.width = 4096;
		this.sun.shadow.mapSize.height = 4096;
		this.sun.castShadow = true;
		this.scene.add( this.sun );

		if ( isBrowser ) this.browserConstructor();

		this.dispatchEvent( "sceneready" );

	}

	browserConstructor() {

		Object.defineProperties( this, {
			renderer: { value: new WebGLRenderer( { antialias: true } ) }
		} );

		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = PCFSoftShadowMap;
		this.renderer.shadowMap.soft = true;

		this.renderer.setSize( window.innerWidth, window.innerHeight );

		this.dispatchEvent( "rendererready" );

		if ( ! this.renderer.domElement.parentNode )
			document.body.appendChild( this.renderer.domElement );

	}

	test( entity ) {

		return !! entity.model && !! entity.model._object3D;

	}

	onObject3D( event ) {

		console.log( event );

	}

	onEntityAdded( { entity } ) {

		entity.model.addEventListener( "updated", this.onObject3D );

		if ( ! this.scene ) return this._queuedAdds.push( entity );

		if ( entity.model._object3D ) this.scene.add( entity.model._object3D );

	}

	onEntityRemoved( { entity } ) {

		entity.model.remoevEventListener( "updated", this.onObject3D );

		if ( ! this.scene ) {

			const index = this._queuedAdds.indexOf( entity );
			if ( index >= 0 ) this._queuedAdds.splice( index, 1 );

			return;

		}

		this.scene.remove( entity );

	}

	onSceneReady() {

		for ( let i = 0; i < this._queuedAdds.length; i ++ )
			this.onEntityAdded( { entity: this._queuedAdds[ i ] } );

	}

	preRender() {

		this.renderer.render( this.scene, this.camera );

	}

}
