import { dragSelect } from "./dragSelect.js";
import {
	active as activeObstructionPlacement,
	snap,
	start as showObstructionPlacement,
	stop as hideObstructionPlacement,
	valid as obstructionPlacementValid,
} from "./obstructionPlacement.js";
import { Unit } from "./Unit.js";
import { Crosser } from "./Crosser.js";
import { Obstruction } from "./obstructions/Obstruction.js";
import { clientToWorld } from "../players/camera.js";
import { Defender } from "./Defender.js";
import { SpriteElement } from "./Sprite.js";
import { obstructionMap } from "./obstructions/index.js";
import { activeHotkeys } from "../ui/hotkeys.js";
import { UIEvents } from "../ui/index.js";
import { Game } from "../Game.js";
import { Player } from "../players/Player.js";

export type Action = {
	description?: string;
	name: string;
	hotkey:
		| "a"
		| "b"
		| "c"
		| "d"
		| "e"
		| "f"
		| "g"
		| "h"
		| "i"
		| "j"
		| "k"
		| "l"
		| "m"
		| "n"
		| "o"
		| "p"
		| "q"
		| "r"
		| "s"
		| "t"
		| "u"
		| "v"
		| "w"
		| "x"
		| "y"
		| "z"
		| " "
		| "Escape";
	elem?: HTMLElement;
} & (
	| {
			type: "build";
			obstruction: typeof Obstruction;
	  }
	| {
			type: "custom";
			handler: (data: { player: Player }) => void;
	  }
);

const rightClick: UIEvents["mouseDown"] = ({
	game,
	target: htmlTarget,
	x: clientX,
	y: clientY,
}) => {
	const { x, y } = clientToWorld({ x: clientX, y: clientY });

	const ownedSprites = dragSelect.selection.filter(
		(s) => s.owner === game.localPlayer,
	);

	const units = ownedSprites.filter((u) => u instanceof Unit);
	const toMove: number[] = [];
	const toAttack: number[] = [];
	const target = (htmlTarget as SpriteElement | undefined)?.sprite;

	units.forEach((unit) => {
		if (unit instanceof Crosser) toMove.push(unit.id);
		else if (unit instanceof Defender)
			if (
				(target && target instanceof Crosser) ||
				target instanceof Obstruction
			)
				toAttack.push(unit.id);
			else toMove.push(unit.id);
	});

	if (toMove.length) game.transmit({ type: "move", sprites: toMove, x, y });

	if (toAttack.length)
		game.transmit({
			type: "attack",
			attackers: toAttack,
			x,
			y,
			target: target?.id,
		});

	// Filter out obstructions when ordering to move
	if (toMove.length > 0 && ownedSprites.some((u) => u instanceof Obstruction))
		dragSelect.setSelection(units);
};

const leftClick: UIEvents["mouseDown"] = ({ x: clientX, y: clientY, game }) => {
	if (!obstructionPlacementValid()) return;
	const obstruction = activeObstructionPlacement()!;

	const { x: xWorld, y: yWorld } = clientToWorld({
		x: clientX,
		y: clientY,
	});
	const x = snap(xWorld);
	const y = snap(yWorld);

	hideObstructionPlacement();

	const builder = dragSelect.selection.find(
		(s) => s.owner === game.localPlayer && s instanceof Crosser,
	);

	if (!builder) return;

	game.transmit({
		type: "build",
		builder: builder.id,
		x,
		y,
		obstruction: obstruction.name,
	});
};

export const initSpriteLogicListeners = (game: Game): void => {
	game.ui.addEventListener("mouseDown", (e) => {
		if (!game.round) return;

		if (e.button === 2 || e.ctrlDown) return rightClick(e);
		if (e.button === 0) leftClick(e);
	});

	game.ui.addEventListener("keyDown", (e) => {
		if (!game.round) return;

		const hotkey = activeHotkeys.find((b) => b.hotkey === e.key);
		if (!hotkey) return;

		// if (typeof hotkey === "function") return hotkey();
		if (hotkey.type === "custom")
			return hotkey.handler({ player: game.localPlayer });

		if (hotkey.type === "build") {
			const ownerCrossers = dragSelect.selection.filter(
				(u) =>
					u.owner === game.localPlayer && u.constructor === Crosser,
			);

			if (ownerCrossers.length)
				showObstructionPlacement(hotkey.obstruction);
		}
	});

	game.addNetworkListener("build", (e) => {
		const { x, y, time, connection, obstruction, builder } = e;

		game.update({ time });

		if (!game.round) return;

		const player = game.round.players.find((p) => p.id === connection);
		if (!player) return;

		const unit = player.sprites.find(
			(s) => s.id === builder && s instanceof Crosser,
		);
		if (!unit || !Crosser.isCrosser(unit)) return;

		unit.buildAt({ x, y }, obstructionMap[obstruction]);
	});

	game.addNetworkListener("move", ({ time, connection, sprites, x, y }) => {
		game.update({ time });

		if (!game.round) return;

		const player = game.round.players.find((p) => p.id === connection);
		if (!player) return;

		player.sprites
			.filter((s) => sprites.includes(s.id))
			.filter(Unit.isUnit)
			.forEach((s) => s.walkTo({ x, y }));
	});

	game.addNetworkListener(
		"attack",
		({ time, connection, attackers, target: targetId }) => {
			game.update({ time });

			if (!game.round) return;

			const player = game.round.players.find((p) => p.id === connection);
			if (!player) return;

			const target = game.round.sprites.find((s) => s.id === targetId);
			if (!target) return;

			player.sprites
				.filter((s) => attackers.includes(s.id))
				.filter(Defender.isDefender)
				.forEach((s) => s.attack(target));
		},
	);

	game.addNetworkListener("kill", ({ time, sprites, connection }) => {
		game.update({ time });

		if (!game.round) return;

		const player = game.round.players.find((p) => p.id === connection);
		if (!player) return;

		player.sprites
			.filter((s) => sprites.includes(s.id))
			.forEach((s) => s.kill());
	});

	game.addNetworkListener("holdPosition", ({ time, connection, sprites }) => {
		game.update({ time });

		if (!game.round) return;

		const player = game.round.players.find((p) => p.id === connection);
		if (!player) return;

		player.sprites
			.filter((s) => sprites.includes(s.id))
			.filter(Unit.isUnit)
			.forEach((s) => s.holdPosition());
	});

	game.addNetworkListener("stop", ({ time, connection, sprites }) => {
		game.update({ time });

		if (!game.round) return;

		const player = game.round.players.find((p) => p.id === connection);
		if (!player) return;

		player.sprites
			.filter((s) => sprites.includes(s.id))
			.filter(Unit.isUnit)
			.forEach((s) => s.stop());
	});

	game.addNetworkListener("mirror", ({ time, connection, sprites }) => {
		game.update({ time });

		if (!game.round) return;

		const player = game.round.players.find((p) => p.id === connection);
		if (!player) return;

		player.sprites
			.filter((s) => sprites.includes(s.id))
			.filter(Defender.isDefender)
			.forEach((s) => s.mirror());
	});
};
