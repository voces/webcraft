import { Unit } from "./Unit";
import { Crosser } from "./Crosser";
import { Obstruction } from "./obstructions/Obstruction";
import { Defender } from "./Defender";
import { obstructionMap } from "./obstructions/index";
import { Game } from "../../Game";
import { Player } from "../../players/Player";
import { MouseEvents } from "../../systems/Mouse";
import { isSprite } from "../../typeguards";
import { currentGame } from "../../gameContext";

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

const rightClick: MouseEvents["mouseDown"] = ({ mouse }) => {
	const { x, y } = mouse.ground;
	const game = currentGame();

	const ownedSprites = game.selectionSystem.selection.filter(
		(s) => isSprite(s) && s.owner === game.localPlayer,
	);

	const units = ownedSprites.filter((u) => u instanceof Unit);
	const toMove: number[] = [];
	const toAttack: number[] = [];
	const target = mouse.entity;

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
		game.selectionSystem.setSelection(units);
};

const leftClick: MouseEvents["mouseDown"] = ({ mouse }) => {
	const game = currentGame();

	const obstructionPlacement = game.obstructionPlacement;
	if (!obstructionPlacement) return;
	if (!obstructionPlacement.valid) return;
	const obstruction = obstructionPlacement.active!;

	const x = obstructionPlacement.snap(mouse.ground.x);
	const y = obstructionPlacement.snap(mouse.ground.y);

	obstructionPlacement.stop();

	const builder = game.selectionSystem.selection.find(
		(s): s is Crosser =>
			isSprite(s) && s.owner === game.localPlayer && Crosser.isCrosser(s),
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
	game.mouse.addEventListener("mouseDown", (e) => {
		if (!game.round) return;

		if (e.button === 2 || e.ctrlDown) return rightClick(e);
		if (e.button === 0) leftClick(e);
	});

	game.ui.addEventListener("keyDown", (e) => {
		if (!game.round) return;

		const hotkey = game.actions.activeActions.find(
			(b) => b.hotkey === e.key,
		);
		if (!hotkey) return;

		// if (typeof hotkey === "function") return hotkey();
		if (hotkey.type === "custom")
			return hotkey.handler({ player: game.localPlayer });

		if (hotkey.type === "build") {
			const ownerCrossers = game.selectionSystem.selection.filter(
				(u): u is Crosser =>
					isSprite(u) &&
					u.owner === game.localPlayer &&
					u.constructor === Crosser,
			);

			if (ownerCrossers.length) {
				const obstructionPlacement = game.obstructionPlacement;
				if (!obstructionPlacement) return;
				obstructionPlacement.start(hotkey.obstruction);
			}
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
