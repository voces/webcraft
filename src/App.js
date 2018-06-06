
import ECS from "../node_modules/knack-ecs/src/App.js";

import { isBrowser } from "./util.js";
import Player from "./entities/Player.js";

export default class App extends ECS {

	constructor( props = {} ) {

		super();

		const isHost = ! props.host;

		// Graphic stuff
		if ( isBrowser ) this.initBrowser( props );

		if ( isHost ) this.initServer( props );
		else this.initClient( props );

		// else this.initServer();

	}

	initBrowser() {

		requestAnimationFrame( this.render.bind( this ) );

	}

	initClient() {

	}

	initServer( props ) {

		if ( props.username ) {

			this.localPlayer = new Player( { player: { username: props.username } } );
			this.addEntity( this.localPlayer );

		}

		this.update.last = Date.now();
		setInterval( this.update.bind( this ), 20 );

	}

	update() {

		const now = Date.now();
		const delta = now - this.update.last;
		this.update.last = now;

		super.update( delta );

	}

	render( elapsed ) {

		requestAnimationFrame( elapsed => this.render( elapsed ) );

		if ( ! this.render.last ) {

			this.render.last = elapsed;
			return;

		}

		const delta = elapsed - this.render.last;
		this.render.last = elapsed;

		super.render( delta );

	}

}
