
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
import Unit from "./Unit.js";
import Crosser from "./Crosser.js";
import Obstruction from "./obstructions/Obstruction.js";
import Basic from "./obstructions/Basic.js";
import Huge from "./obstructions/Huge.js";
import Tiny from "./obstructions/Tiny.js";
import Large from "./obstructions/Large.js";
import { document, window } from "../util/globals.js";
import { panTo } from "../players/camera.js";

const arena = document.getElementById( "arena" );

export const hotkeys = {
	f: {
		name: "Build Basic Box",
		type: "build",
		obstruction: Basic,
	},
	r: {
		name: "Build Huge Box",
		type: "build",
		obstruction: Huge,
	},
	t: {
		name: "Build Tiny Box",
		type: "build",
		obstruction: Tiny,
	},
	w: {
		name: "Build Large Box",
		type: "build",
		obstruction: Large,
	},
	x: {
		name: "Destoy Box",
		description: "Destroys selected or last created box",
		handler: () => {

			if ( ! game.round || ! game.localPlayer.unit || ! ( game.localPlayer.unit instanceof Crosser ) )
				return;

			const selection = dragSelect.getSelection();

			const ownedUnits = selection
				.filter( u => u.owner === game.localPlayer );

			dragSelect.setSelection( [ game.localPlayer.unit.elem ] );

			// Kill selected obstructions
			let includesObstruction = false;
			ownedUnits.forEach( u => {

				if ( u instanceof Obstruction ) {

					network.send( { type: "kill", sprite: u.id } );
					includesObstruction = true;

				}

			} );

			// If no obstructions were selected, but a crosser was, kill the last obstruction
			let crosser;
			if ( ! includesObstruction && ( crosser = ownedUnits.find( u => u instanceof Crosser ) ) )
				while ( crosser.obstructions.length ) {

					const obstruction = crosser.obstructions.pop();
					if ( obstruction && obstruction.health > 0 ) {

						network.send( { type: "kill", sprite: obstruction.id } );
						break;

					}

				}

		},
	},
	h: {
		name: "Hold Position",
		handler: () => {

			if ( ! game.round )
				return;

			const ownedUnits = dragSelect.getSelection()
				.filter( u => u.owner === game.localPlayer && u instanceof Unit );

			network.send( { type: "holdPosition", sprites: ownedUnits.map( u => u.id ) } );

		},
	},
	s: {
		name: "Stop",
		handler: () => {

			if ( ! game.round )
				return;

			const ownedUnits = dragSelect.getSelection()
				.filter( u => u.owner === game.localPlayer && u instanceof Unit );

			network.send( { type: "stop", sprites: ownedUnits.map( u => u.id ) } );

		},
	},
	Escape: () => {

		if ( activeObstructionPlacement )
			hideObstructionPlacement();

	},
	" ": () => {

		const selection = dragSelect.getSelection();
		if ( selection.length === 0 && game.localPlayer.sprites.length )
			return dragSelect.setSelection( [ game.localPlayer.sprites[ 0 ] ] );

		const { xSum, ySum } = selection.reduce(
			( { xSum, ySum }, { x, y } ) =>
				( { xSum: xSum + x, ySum: ySum + y } ),
			{ xSum: 0, ySum: 0 }
		);

		const x = xSum / selection.length;
		const y = ySum / selection.length;
		panTo( { x, y } );

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

	if ( e.button === 2 || e.ctrlKey ) return rightClick( e );
	if ( e.button === 0 ) leftClick( e );

} );

const leftClick = e => {

	if ( ! obstructionPlacementValid() ) return;
	const obstruction = activeObstructionPlacement();

	const x = snap( ( e.clientX - arena.x ) / WORLD_TO_GRAPHICS_RATIO );
	const y = snap( ( e.clientY - arena.y ) / WORLD_TO_GRAPHICS_RATIO );

	hideObstructionPlacement();

	const builder = dragSelect.getSelection()
		.find( s => s.owner === game.localPlayer && s instanceof Crosser );

	if ( ! builder ) return;

	network.send( { type: "build", builder: builder.id, x, y, obstruction: obstruction.name } );

};

network.addEventListener( "build", e => {

	const { x, y, time, connection, obstruction, builder } = e;

	game.update( { time } );

	if ( ! game.round ) return;

	const player = game.round.players.find( p => p.id === connection );
	if ( ! player ) return;

	const unit = player.sprites.find( s => s.id === builder && s instanceof Crosser );
	if ( ! unit || typeof unit.buildAt !== "function" ) return;

	unit.buildAt( game.round.pathingMap, { x, y }, obstructions[ obstruction ] );

} );

const rightClick = e => {

	const x = ( e.clientX - arena.x ) / WORLD_TO_GRAPHICS_RATIO;
	const y = ( e.clientY - arena.y ) / WORLD_TO_GRAPHICS_RATIO;

	const selection = dragSelect.getSelection();

	const ownedSprites = selection
		.filter( u => u.owner === game.localPlayer );

	const units = ownedSprites.filter( u => u instanceof Unit );

	units.forEach( unit => {

		if ( unit instanceof Crosser ) network.send( { type: "move", sprite: unit.id, x, y } );
		else {

			const target = e.target.sprite;
			if ( target && target.owner !== unit.owner && target.owner )
				network.send( { type: "attack", attacker: unit.id, target: target.id } );
			else
				network.send( { type: "move", sprite: unit.id, x, y } );

		}

	} );

	if ( ownedSprites.length > units.length )
		dragSelect.setSelection( units.map( u => u.elem ).filter( Boolean ) );

};

window.addEventListener( "keydown", e => {

	if ( ! game.round ) return;

	if ( ! hotkeys[ e.key ] ) return;
	const hotkey = hotkeys[ e.key ];

	if ( typeof hotkey === "function" ) return hotkey();
	if ( typeof hotkey.handler === "function" ) return hotkey.handler();

	if ( hotkey.type === "build" ) {

		const selection = dragSelect.getSelection();

		const ownerCrossers = selection
			.filter( u => u.owner === game.localPlayer && u.constructor === Crosser );

		if ( ownerCrossers.length ) showObstructionPlacement( hotkey.obstruction );

	}

} );

network.addEventListener( "move", ( { time, connection, x, y } ) => {

	game.update( { time } );

	if ( ! game.round ) return;

	const player = game.round.players.find( p => p.id === connection );
	if ( ! player ) return;

	const unit = player.unit;
	if ( ! unit ) return;

	unit.walkTo( game.round.pathingMap, { x, y } );

} );

network.addEventListener( "attack", ( { time, connection, attacker: attackerId, target: targetId } ) => {

	game.update( { time } );

	if ( ! game.round ) return;

	const player = game.round.players.find( p => p.id === connection );
	if ( ! player ) return;

	const attacker = player.sprites.find( s => s.id === attackerId );
	if ( ! attacker || typeof attacker.attack !== "function" ) return;

	const target = game.round.sprites.find( s => s.id === targetId );
	if ( ! target ) return;

	attacker.attack( target );

} );

network.addEventListener( "kill", ( { time, sprite, connection } ) => {

	game.update( { time } );

	if ( ! game.round ) return;

	const player = game.round.players.find( p => p.id === connection );
	if ( ! player ) return;

	const unit = player.sprites.find( s => s.id === sprite );
	if ( ! unit ) return;

	unit.kill();

} );

network.addEventListener( "holdPosition", ( { time, connection, sprites } ) => {

	game.update( { time } );

	if ( ! game.round ) return;

	const player = game.round.players.find( p => p.id === connection );
	if ( ! player ) return;

	player.sprites
		.filter( s => sprites.includes( s.id ) )
		.forEach( s => s.holdPosition() );

} );

network.addEventListener( "stop", ( { time, connection, sprites } ) => {

	game.update( { time } );

	if ( ! game.round ) return;

	const player = game.round.players.find( p => p.id === connection );
	if ( ! player ) return;

	player.sprites
		.filter( s => sprites.includes( s.id ) )
		.forEach( s => s.stop() );

} );
