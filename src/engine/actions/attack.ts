import { isInAttackRange } from "../api/UnitApi";
import { DamageComponent } from "../components/DamageComponent";
import type { Unit } from "../entities/widgets/sprites/Unit";
import { currentGame } from "../gameContext";
import type { AttackEvent } from "../Network";
import { isSprite, isUnit } from "../typeguards";
import type { TargetActionProps } from "./types";

export const attackAction = {
	name: "Attack",
	hotkey: "a" as const,
	type: "target" as const,
	localHandler: ({ target }: TargetActionProps): void => {
		const game = currentGame();

		const units = game.selectionSystem.selection.filter(
			(s): s is Unit => isUnit(s) && s.owner === game.localPlayer,
		);

		const attackers = units.filter(
			(u) =>
				u.has(DamageComponent) &&
				(isInAttackRange(u, target) || u.speed > 0),
		);

		if (attackers.length)
			game.transmit({
				type: "attack",
				attackers: attackers.map((u) => u.id),
				target: target.id,
			});
	},
	syncHandler: ({
		time,
		connection,
		attackers,
		target: targetId,
	}: AttackEvent): void => {
		const game = currentGame();
		game.update({ time });

		const player = game.players.find((p) => p.id === connection);
		if (!player) return;

		const target = game.entities.find((s) => s.id === targetId);
		if (!target || !isSprite(target)) return;

		player.sprites
			.filter((s) => attackers.includes(s.id))
			.filter(isUnit)
			.forEach((s) => s.attack(target));
	},
};
