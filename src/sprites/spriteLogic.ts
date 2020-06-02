
import game from "../index.js";
import network from "../network.js";
import dragSelect from "./dragSelect.js";
import {
	active as activeObstructionPlacement,
	snap,
	start as showObstructionPlacement,
	stop as hideObstructionPlacement,
	valid as obstructionPlacementValid,
} from "./obstructionPlacement.js";
import { Unit } from "./Unit.js";
import Crosser from "./Crosser.js";
import { Obstruction } from "./obstructions/Obstruction.js";
import { window } from "../util/globals.js";
import { panTo, clientToWorld } from "../players/camera.js";
import Defender from "./Defender.js";
import { Sprite, SpriteElement } from "./Sprite.js";
import {
	obstructionMap,
	Basic,
	Dense,
	Huge,
	Slow,
	Stack,
	Tiny,
	Large,
	Resource,
	ObstructionSubclass,
} from "./obstructions/index.js";

const isOwn = ( u: Sprite ) => u.owner === game.localPlayer;
const includesSelectedUnit = ( condition: ( sprite: Sprite ) => boolean ) => () =>
	dragSelect.selection.some( condition );
const hasOwnCrosser = includesSelectedUnit( u =>
	isOwn( u ) && u instanceof Crosser );
const hasOwnCrosserOrObstruction = includesSelectedUnit( u =>
	isOwn( u ) && ( u instanceof Crosser || u instanceof Obstruction ) );
const hasOwnUnit = includesSelectedUnit( u => isOwn( u ) && u instanceof Unit );

export type Hotkey = {
	activeWhen: () => boolean;
	description?: string,
	name: string,
} & ( {
	type: "build",
	obstruction: ObstructionSubclass
} | {
	type: "custom",
	handler: () => void
} ) | ( () => void )

// todo: change this to an array so multiple actions can shar the same hotkey (r = mirror + huge)
export const hotkeys: Record<string, Hotkey> = {
	f: {
		name: "Build Basic Box",
		type: "build",
		obstruction: Basic,
		activeWhen: hasOwnCrosser,
	},
	g: {
		name: "Build Dense Box",
		type: "build",
		obstruction: Dense,
		activeWhen: hasOwnCrosser,
	},
	r: {
		name: "Build Huge Box",
		type: "custom",
		activeWhen: hasOwnUnit,
		handler: (): void => {

			const ownUnits = dragSelect.selection
				.filter( u => u.owner === game.localPlayer && u instanceof Unit );

			if ( ownUnits.some( u => u instanceof Crosser ) )
				showObstructionPlacement( Huge );

			const realDefenders = ownUnits.filter( u => Unit.isUnit( u ) && ! u.isMirror );
			if ( realDefenders.length ) network.send( { type: "mirror", sprites: realDefenders.map( u => u.id ) } );

		},
	},
	q: {
		name: "Build Slow Box",
		type: "build",
		obstruction: Slow,
		activeWhen: hasOwnCrosser,
	},
	a: {
		name: "Build Stack Box",
		description: "Can be built anywhere",
		type: "build",
		obstruction: Stack,
		activeWhen: hasOwnCrosser,
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
	e: {
		name: "Build Resource Box",
		description: "Increases essence generation for the entire team.",
		type: "build",
		obstruction: Resource,
		activeWhen: hasOwnCrosser,
	},
	x: {
		name: "Destoy Box",
		description: "Destroys selected or last created box",
		type: "custom",
		activeWhen: hasOwnCrosserOrObstruction,
		handler: (): void => {

			const playerCrosser = game.localPlayer.unit;
			if ( ! playerCrosser ) return;

			const ownedUnits = dragSelect.selection
				.filter( isOwn );

			dragSelect.setSelection( [ playerCrosser ] );

			const obstructions = ownedUnits.filter( Obstruction.isObstruction );

			// Kill selected obstructions
			if ( obstructions.length )
				network.send( { type: "kill", sprites: obstructions.map( u => u.id ) } );

			// If no obstructions were selected, but a crosser was, kill the last obstruction
			let crosser: Crosser | undefined;
			if ( ! obstructions.length && ( crosser = ownedUnits.find( Crosser.isCrosser ) ) ) {

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
		type: "custom",
		activeWhen: hasOwnUnit,
		handler: (): void => {

			if ( ! game.round )
				return;

			const ownedUnits = dragSelect.selection
				.filter( u => u.owner === game.localPlayer && u instanceof Unit );

			network.send( { type: "holdPosition", sprites: ownedUnits.map( u => u.id ) } );

		},
	},
	s: {
		name: "Stop",
		type: "custom",
		activeWhen: hasOwnUnit,
		handler: (): void => {

			if ( ! game.round )
				return;

			const ownedUnits = dragSelect.selection
				.filter( u => u.owner === game.localPlayer && u instanceof Unit );

			network.send( { type: "stop", sprites: ownedUnits.map( u => u.id ) } );

		},
	},
	Escape: (): void => {

		if ( activeObstructionPlacement() )
			hideObstructionPlacement();

	},
	" ": (): void => {

		if ( dragSelect.selection.length === 0 && game.localPlayer.sprites.length )
			return dragSelect.setSelection( [ game.localPlayer.sprites[ 0 ] ] );

		const { xSum, ySum } = dragSelect.selection.reduce(
			( { xSum, ySum }, { x, y } ) =>
				( { xSum: xSum + x, ySum: ySum + y } ),
			{ xSum: 0, ySum: 0 },
		);

		const x = xSum / dragSelect.selection.length;
		const y = ySum / dragSelect.selection.length;
		panTo( { x, y } );

	},
};

window.addEventListener( "mousedown", e => {

	if ( ! game.round ) return;

	if ( e.button === 2 || e.ctrlKey ) return rightClick( e );
	if ( e.button === 0 ) leftClick( e );

} );

type Event = {
	time: number,
	connection: number;
}

const leftClick = ( e: MouseEvent ) => {

	if ( ! obstructionPlacementValid() ) return;
	const obstruction = activeObstructionPlacement()!;

	const { x: xWorld, y: yWorld } = clientToWorld( { x: e.clientX, y: e.clientY } );
	const x = snap( xWorld );
	const y = snap( yWorld );

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
	if ( ! unit || ! Crosser.isCrosser( unit ) ) return;

	unit.buildAt( { x, y }, obstructionMap[ obstruction ] );

} );

const rightClick = ( e: MouseEvent ) => {

	const { x, y } = clientToWorld( { x: e.clientX, y: e.clientY } );

	const ownedSprites = dragSelect.selection
		.filter( isOwn );

	const units = ownedSprites.filter( u => u instanceof Unit );
	const toMove: number[] = [];
	const toAttack: number[] = [];
	const target = ( e.target as SpriteElement | undefined )?.sprite;

	units.forEach( unit => {

		if ( unit instanceof Crosser ) toMove.push( unit.id );
		else if ( unit instanceof Defender )

			if ( target && target instanceof Crosser || target instanceof Obstruction )
				toAttack.push( unit.id );
			else
				toMove.push( unit.id );

	} );

	if ( toMove.length ) network.send( { type: "move", sprites: toMove, x, y } );
	if ( toAttack.length ) network.send( { type: "attack", attackers: toAttack, x, y, target: target?.id } );

	// Filter out obstructions when ordering to move
	if ( toMove.length > 0 && ownedSprites.some( u => u instanceof Obstruction ) )
		dragSelect.setSelection( units );

};

window.addEventListener( "keydown", e => {

	if ( ! game.round ) return;

	const hotkey = hotkeys[ e.key ];
	if ( ! hotkey ) return;

	if ( typeof hotkey === "function" ) return hotkey();
	if ( hotkey.type === "custom" ) return hotkey.handler();

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
		.filter( s => sprites.includes( s.id ) )
		.filter( Unit.isUnit )
		.forEach( s => s.walkTo( { x, y } ) );

} );

network.addEventListener( "attack", ( { time, connection, attackers, target: targetId } ) => {

	game.update( { time } );

	if ( ! game.round ) return;

	const player = game.round.players.find( p => p.id === connection );
	if ( ! player ) return;

	const target = game.round.sprites.find( s => s.id === targetId );
	if ( ! target ) return;

	player.sprites
		.filter( s => attackers.includes( s.id ) )
		.filter( Defender.isDefender )
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
		.filter( Unit.isUnit )
		.forEach( s => s.holdPosition() );

} );

network.addEventListener( "stop", ( { time, connection, sprites } ) => {

	game.update( { time } );

	if ( ! game.round ) return;

	const player = game.round.players.find( p => p.id === connection );
	if ( ! player ) return;

	player.sprites
		.filter( s => sprites.includes( s.id ) )
		.filter( Unit.isUnit )
		.forEach( s => s.stop() );

} );

network.addEventListener( "mirror", ( { time, connection, sprites } ) => {

	game.update( { time } );

	if ( ! game.round ) return;

	const player = game.round.players.find( p => p.id === connection );
	if ( ! player ) return;

	player.sprites
		.filter( s => sprites.includes( s.id ) )
		.filter( Defender.isDefender )
		.forEach( s => s.mirror() );

} );
