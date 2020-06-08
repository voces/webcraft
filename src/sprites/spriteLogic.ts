import { game } from "../index.js";
import { network } from "../network.js";
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
import { window } from "../util/globals.js";
import { clientToWorld } from "../players/camera.js";
import { Defender } from "./Defender.js";
import { Sprite, SpriteElement } from "./Sprite.js";
import { obstructionMap } from "./obstructions/index.js";
import { activeHotkeys } from "../ui/hotkeys.js";

const isOwn = (u: Sprite) => u.owner === game.localPlayer;

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
			handler: () => void;
	  }
);

window.addEventListener("mousedown", (e) => {
	if (!game.round) return;

	if (e.button === 2 || e.ctrlKey) return rightClick(e);
	if (e.button === 0) leftClick(e);
});

const leftClick = (e: MouseEvent) => {
	if (!obstructionPlacementValid()) return;
	const obstruction = activeObstructionPlacement()!;

	const { x: xWorld, y: yWorld } = clientToWorld({
		x: e.clientX,
		y: e.clientY,
	});
	const x = snap(xWorld);
	const y = snap(yWorld);

	hideObstructionPlacement();

	const builder = dragSelect.selection.find(
		(s) => s.owner === game.localPlayer && s instanceof Crosser,
	);

	if (!builder) return;

	network.send({
		type: "build",
		builder: builder.id,
		x,
		y,
		obstruction: obstruction.name,
	});
};

network.addEventListener("build", (e) => {
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

const rightClick = (e: MouseEvent) => {
	const { x, y } = clientToWorld({ x: e.clientX, y: e.clientY });

	const ownedSprites = dragSelect.selection.filter(isOwn);

	const units = ownedSprites.filter((u) => u instanceof Unit);
	const toMove: number[] = [];
	const toAttack: number[] = [];
	const target = (e.target as SpriteElement | undefined)?.sprite;

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

	if (toMove.length) network.send({ type: "move", sprites: toMove, x, y });
	if (toAttack.length)
		network.send({
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

window.addEventListener("keydown", (e) => {
	if (!game.round) return;

	const hotkey = activeHotkeys.find((b) => b.hotkey === e.key);
	if (!hotkey) return;

	// if (typeof hotkey === "function") return hotkey();
	if (hotkey.type === "custom") return hotkey.handler();

	if (hotkey.type === "build") {
		const ownerCrossers = dragSelect.selection.filter(
			(u) => u.owner === game.localPlayer && u.constructor === Crosser,
		);

		if (ownerCrossers.length) showObstructionPlacement(hotkey.obstruction);
	}
});

network.addEventListener("move", ({ time, connection, sprites, x, y }) => {
	game.update({ time });

	if (!game.round) return;

	const player = game.round.players.find((p) => p.id === connection);
	if (!player) return;

	player.sprites
		.filter((s) => sprites.includes(s.id))
		.filter(Unit.isUnit)
		.forEach((s) => s.walkTo({ x, y }));
});

network.addEventListener(
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

network.addEventListener("kill", ({ time, sprites, connection }) => {
	game.update({ time });

	if (!game.round) return;

	const player = game.round.players.find((p) => p.id === connection);
	if (!player) return;

	player.sprites
		.filter((s) => sprites.includes(s.id))
		.forEach((s) => s.kill());
});

network.addEventListener("holdPosition", ({ time, connection, sprites }) => {
	game.update({ time });

	if (!game.round) return;

	const player = game.round.players.find((p) => p.id === connection);
	if (!player) return;

	player.sprites
		.filter((s) => sprites.includes(s.id))
		.filter(Unit.isUnit)
		.forEach((s) => s.holdPosition());
});

network.addEventListener("stop", ({ time, connection, sprites }) => {
	game.update({ time });

	if (!game.round) return;

	const player = game.round.players.find((p) => p.id === connection);
	if (!player) return;

	player.sprites
		.filter((s) => sprites.includes(s.id))
		.filter(Unit.isUnit)
		.forEach((s) => s.stop());
});

network.addEventListener("mirror", ({ time, connection, sprites }) => {
	game.update({ time });

	if (!game.round) return;

	const player = game.round.players.find((p) => p.id === connection);
	if (!player) return;

	player.sprites
		.filter((s) => sprites.includes(s.id))
		.filter(Defender.isDefender)
		.forEach((s) => s.mirror());
});
