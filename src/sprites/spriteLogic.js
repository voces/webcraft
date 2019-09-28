
import game from "../index.js";
import network from "../network.js";
import { WORLD_TO_GRAPHICS_RATIO } from "../constants.js";
import dragSelect from "./dragSelect.js";
import {
	active as activeObstructionPlacement,
	snap,
	start as showObstructionPlacement,
	stop as hideObstructionPlacement,
	valid as obstructionPlacementValid,
} from "./obstructionPlacement.js";
import Crosser from "./Crosser.js";
import Obstruction from "./obstructions/Obstruction.js";
import Basic from "./obstructions/Basic.js";
import Huge from "./obstructions/Huge.js";
import Tiny from "./obstructions/Tiny.js";
import Large from "./obstructions/Large.js";

const hotkeys = {
	f: {
		type: "build",
		obstruction: Basic,
	},
	r: {
		type: "build",
		obstruction: Huge,
	},
	t: {
		type: "build",
		obstruction: Tiny,
	},
	w: {
		type: "build",
		obstruction: Large,
	},
	x: () => {

		const selection = dragSelect.getSelection();

		const ownedUnits = selection
			.filter( u => u.owner === game.localPlayer );

		dragSelect.setSelection( [ game.localPlayer.unit.elem ] );

		ownedUnits.forEach( u => {

			if ( u instanceof Obstruction ) u.kill();

		} );

	},
	Escape: () => {

		if ( activeObstructionPlacement )
			hideObstructionPlacement();

	},
};

const obstructions = {
	Basic,
	Huge,
	Tiny,
	Large,
};

window.addEventListener( "mousedown", e => {

	if ( ! game.round ) return;

	if ( e.button === 0 ) leftClick( e );
	if ( e.button === 2 ) rightClick( e );

} );

const leftClick = e => {

	if ( ! obstructionPlacementValid() ) return;
	const obstruction = activeObstructionPlacement();

	const x = snap( e.clientX / WORLD_TO_GRAPHICS_RATIO );
	const y = snap( e.clientY / WORLD_TO_GRAPHICS_RATIO );

	hideObstructionPlacement();

	network.send( { type: "build", x, y, obstruction: obstruction.name } );

};

network.addEventListener( "build", e => {

	const { x, y, time, connection, obstruction } = e;

	if ( ! game.round ) return;
	game.update( { time } );

	const player = game.round.players.find( p => p.id === connection );
	if ( ! player ) return;

	const unit = player.unit;
	if ( ! unit ) return;

	unit.buildAt( game.round.pathingMap, { x, y }, obstructions[ obstruction ] );

} );

const rightClick = e => {

	const x = e.clientX / WORLD_TO_GRAPHICS_RATIO;
	const y = e.clientY / WORLD_TO_GRAPHICS_RATIO;

	const selection = dragSelect.getSelection();

	const ownedUnits = selection
		.filter( u => u.owner === game.localPlayer );

	if ( ownedUnits.length ) network.send( { type: "move", x, y } );

};

window.addEventListener( "keydown", e => {

	if ( ! game.round ) return;

	if ( ! hotkeys[ e.key ] ) return;
	const hotkey = hotkeys[ e.key ];

	if ( typeof hotkey === "function" ) return hotkey();

	if ( hotkey.type === "build" ) {

		const selection = dragSelect.getSelection();

		const ownerCrossers = selection
			.filter( u => u.owner === game.localPlayer && u.constructor === Crosser );

		if ( ownerCrossers.length ) showObstructionPlacement( hotkey.obstruction );

	}

} );

network.addEventListener( "move", ( { time, connection, x, y } ) => {

	if ( ! game.round ) return;
	game.update( { time } );

	const player = game.round.players.find( p => p.id === connection );
	if ( ! player ) return;

	const unit = player.unit;
	if ( ! unit ) return;

	unit.walkTo( game.round.pathingMap, { x, y } );

} );
