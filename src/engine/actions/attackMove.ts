import { isInAttackRange } from "../api/UnitApi";
import { DamageComponent } from "../components/DamageComponent";
import type { Unit } from "../entities/widgets/sprites/Unit";
import { currentGame } from "../gameContext";
import { isObstruction, isUnit } from "../typeguards";
import type { TargetOrPointActionProps } from "./types";

export const attackMoveAction = {
	name: "Attack",
	hotkey: "a" as const,
	type: "targetOrPoint" as const,
	localHandler: (props: TargetOrPointActionProps): void => {
		const game = currentGame();

		const units = game.selectionSystem.selection.filter(
			(s): s is Unit => isUnit(s) && s.owner === game.localPlayer,
		);

		const target = "target" in props ? props.target : undefined;

		const attackers = target
			? units.filter(
					(u) =>
						u.has(DamageComponent) &&
						(isInAttackRange(u, target) || u.speed > 0),
			  )
			: [];

		const point = "point" in props ? props.point : undefined;

		const movers = point
			? units.filter((u) => !attackers.includes(u) && u.speed > 0)
			: [];

		if (attackers.length)
			game.transmit({
				type: "attack",
				attackers: attackers.map((u) => u.id),
				target: target!.id,
			});

		if (movers.length)
			game.transmit({
				type: "move",
				sprites: movers.map((u) => u.id),
				...point,
			});

		// Filter out obstructions when ordering to move
		if (movers.length > 0 && units.some(isObstruction))
			game.selectionSystem.setSelection(units);
	},
};
