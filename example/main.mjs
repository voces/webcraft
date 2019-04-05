
import {
	Mesh,
	MeshPhongMaterial,
	BoxBufferGeometry
} from "../node_modules/three/build/three.module.js";
import Game from "../src/Game.mjs";
import Graphics from "../src/systems/Graphics.mjs";

const game = window.game = new Game();
game.systems.push( new Graphics() );
game.add( new Mesh( new BoxBufferGeometry(), new MeshPhongMaterial() ) );
game.start();
