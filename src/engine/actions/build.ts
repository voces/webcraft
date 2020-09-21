import { Unit } from "../entities/widgets/sprites/Unit";
import { currentGame } from "../gameContext";
import { BuildEvent } from "../Network";
import { isUnit } from "../typeguards";
import { PointActionProps } from "./types";

export const buildAction = {
	name: "Build",
	hotkey: "b" as const,
	type: "point" as const,
	localHandler: ({ point }: PointActionProps): void => {
		const game = currentGame();

		const obstructionPlacement = game.obstructionPlacement;
		if (!obstructionPlacement) return;
		if (!obstructionPlacement.valid) return;
		const obstruction = obstructionPlacement.active!;

		const x = obstructionPlacement.snap(point.x);
		const y = obstructionPlacement.snap(point.y);

		obstructionPlacement.stop();

		const builder = game.selectionSystem.selection.find(
			(s) =>
				isUnit(s) &&
				s.owner === game.localPlayer &&
				s.builds.includes(obstruction),
		);

		if (!builder) return;

		game.transmit({
			type: "build",
			builder: builder.id,
			x,
			y,
			obstruction: obstruction.name,
		});
	},
	syncHandler: ({
		x,
		y,
		time,
		connection,
		obstruction,
		builder,
	}: BuildEvent): void => {
		const game = currentGame();
		game.update({ time });

		const player = game.players.find((p) => p.id === connection);
		if (!player) return;

		const unit = player.sprites.find(
			(s): s is Unit =>
				s.id === builder &&
				isUnit(s) &&
				s.builds.some((b) => b.name === obstruction),
		);
		if (!unit) return;

		const obstructionClass = unit.builds.find(
			(o) => o.name === obstruction,
		);
		if (!obstructionClass) return;

		unit.buildAt({ x, y }, obstructionClass);
	},
};
