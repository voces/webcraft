
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
import Defender from "./Defender.js";

const arena = document.getElementById( "arena" );

const isOwn = u => u.owner === game.localPlayer;
const includesSelectedUnit = condition => () =>
	dragSelect.selection.some( condition );
const hasOwnCrosser = includesSelectedUnit( u =>
	isOwn( u ) && u instanceof Crosser );
const hasOwnCrosserOrObstruction = includesSelectedUnit( u =>
	isOwn( u ) && ( u instanceof Crosser || u instanceof Obstruction ) );
const hasOwnUnit = includesSelectedUnit( u => isOwn( u ) && u instanceof Unit );

export const hotkeys = {
	f: {
		name: "Build Basic Box",
		type: "build",
		obstruction: Basic,
		activeWhen: hasOwnCrosser,
	},
	r: {
		name: "Build Huge Box",
		activeWhen: hasOwnUnit,
		handler: () => {

			const ownUnits = dragSelect.selection
				.filter( u => u.owner === game.localPlayer && u instanceof Unit );

			if ( ownUnits.some( u => u instanceof Crosser ) )
				showObstructionPlacement( Huge );

			const realDefenders = ownUnits.filter( u => u instanceof Defender && ! u.isMirror );
			if ( realDefenders.length ) network.send( { type: "mirror", sprites: realDefenders.map( u => u.id ) } );

		},
	},
	t: {
		name: "Build Tiny Box",
		type: "build",
		obstruction: Tiny,
		activeWhen: hasOwnCrosser,
	},
	w: {
		name: "Build Large Box",
		type: "build",
		obstruction: Large,
		activeWhen: hasOwnCrosser,
	},
	x: {
		name: "Destoy Box",
		description: "Destroys selected or last created box",
		activeWhen: hasOwnCrosserOrObstruction,
		handler: () => {

			if ( ! game.round || ! game.localPlayer.unit || ! ( game.localPlayer.unit instanceof Crosser ) )
				return;

			const ownedUnits = dragSelect.selection
				.filter( isOwn );

			dragSelect.setSelection( [ game.localPlayer.unit.elem ] );

			const obstructions = ownedUnits.filter( u => u instanceof Obstruction );

			// Kill selected obstructions
			if ( obstructions.length )
				network.send( { type: "kill", sprites: obstructions.map( u => u.id ) } );

			// If no obstructions were selected, but a crosser was, kill the last obstruction
			let crosser;
			if ( ! obstructions.length && ( crosser = ownedUnits.find( u => u instanceof Crosser ) ) ) {

				const obstructions = [ ...crosser.obstructions ];
				while ( obstructions.length ) {

					const obstruction = obstructions.pop();
					if ( obstruction && obstruction.health > 0 ) {

						network.send( { type: "kill", sprites: [ obstruction.id ] } );
						break;

					}

				}

			}

		},
	},
	h: {
		name: "Hold Position",
		activeWhen: hasOwnUnit,
		handler: () => {

			if ( ! game.round )
				return;

			const ownedUnits = dragSelect.selection
				.filter( u => u.owner === game.localPlayer && u instanceof Unit );

			network.send( { type: "holdPosition", sprites: ownedUnits.map( u => u.id ) } );

		},
	},
	s: {
		name: "Stop",
		activeWhen: hasOwnUnit,
		handler: () => {

			if ( ! game.round )
				return;

			const ownedUnits = dragSelect.selection
				.filter( u => u.owner === game.localPlayer && u instanceof Unit );

			network.send( { type: "stop", sprites: ownedUnits.map( u => u.id ) } );

		},
	},
	Escape: () => {

		if ( activeObstructionPlacement )
			hideObstructionPlacement();

	},
	" ": () => {

		if ( dragSelect.selection.length === 0 && game.localPlayer.sprites.length )
			return dragSelect.setSelection( [ game.localPlayer.sprites[ 0 ] ] );

		const { xSum, ySum } = dragSelect.selection.reduce(
			( { xSum, ySum }, { x, y } ) =>
				( { xSum: xSum + x, ySum: ySum + y } ),
			{ xSum: 0, ySum: 0 }
		);

		const x = xSum / dragSelect.selection.length;
		const y = ySum / dragSelect.selection.length;
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

	const builder = dragSelect.selection
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

	const ownedSprites = dragSelect.selection
		.filter( isOwn );

	const units = ownedSprites.filter( u => u instanceof Unit );
	const toMove = [];
	const toAttack = [];
	const target = e.target.sprite;

	units.forEach( unit => {

		if ( unit instanceof Crosser ) toMove.push( unit.id );
		else if ( unit instanceof Defender )

			if ( target && target instanceof Crosser || target instanceof Obstruction )
				toAttack.push( unit.id );
			else
				toMove.push( unit.id );

	} );

	if ( toMove.length ) network.send( { type: "move", sprites: toMove, x, y } );
	if ( toAttack.length ) network.send( { type: "attack", attackers: toAttack, x, y, target: target.id } );

	// Filter out obstructions when ordering to move
	if ( toMove.length > 0 && ownedSprites.some( u => u instanceof Obstruction ) )
		dragSelect.setSelection( units );

};

window.addEventListener( "keydown", e => {

	if ( ! game.round ) return;

	if ( ! hotkeys[ e.key ] ) return;
	const hotkey = hotkeys[ e.key ];

	if ( typeof hotkey === "function" ) return hotkey();
	if ( typeof hotkey.handler === "function" ) return hotkey.handler();

	if ( hotkey.type === "build" ) {

		const ownerCrossers = dragSelect.selection
			.filter( u => u.owner === game.localPlayer && u.constructor === Crosser );

		if ( ownerCrossers.length ) showObstructionPlacement( hotkey.obstruction );

	}

} );

network.addEventListener( "move", ( { time, connection, sprites, x, y } ) => {

	game.update( { time } );

	if ( ! game.round ) return;

	const player = game.round.players.find( p => p.id === connection );
	if ( ! player ) return;

	player.sprites
		.filter( s => sprites.includes( s.id ) && typeof s.walkTo === "function" )
		.forEach( s => s.walkTo( game.round.pathingMap, { x, y } ) );

} );

network.addEventListener( "attack", ( { time, connection, attackers, target: targetId } ) => {

	game.update( { time } );

	if ( ! game.round ) return;

	const player = game.round.players.find( p => p.id === connection );
	if ( ! player ) return;

	const target = game.round.sprites.find( s => s.id === targetId );
	if ( ! target ) return;

	player.sprites
		.filter( s => attackers.includes( s.id ) && typeof s.attack === "function" )
		.forEach( s => s.attack( target ) );

} );

network.addEventListener( "kill", ( { time, sprites, connection } ) => {

	game.update( { time } );

	if ( ! game.round ) return;

	const player = game.round.players.find( p => p.id === connection );
	if ( ! player ) return;

	player.sprites
		.filter( s => sprites.includes( s.id ) )
		.forEach( s => s.kill() );

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

network.addEventListener( "mirror", ( { time, connection, sprites } ) => {

	game.update( { time } );

	const player = game.round.players.find( p => p.id === connection );
	if ( ! player ) return;

	player.sprites
		.filter( s => sprites.includes( s.id ) )
		.forEach( s => s.mirror() );

} );
