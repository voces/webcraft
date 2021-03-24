import type { ImmediateActionProps } from "../../engine/actions/types";
import type { Sprite } from "../../engine/entities/widgets/Sprite";
import { isObstruction, isSprite } from "../../engine/typeguards";
import { appendErrorMessage } from "../../engine/ui/chat";
import type { Obstruction } from "../entities/Obstruction";
import { currentMazingContest } from "../mazingContestContext";
import type { SelfDestructEvent } from "../MazingContestNetwork";
import type { Player } from "../players/Player";
import { isBuilder, isThunder } from "../typeguards";

export const selfDestructAction = {
	name: "Destroy box",
	description: "Destroys selected boxes",
	hotkey: "x" as const,
	type: "custom" as const,
	localHandler: ({ player }: ImmediateActionProps<Player>): void => {
		let tnt = player.resources.tnt ?? 0;
		// Get currently selected boxes
		const obstructions = player.game.selectionSystem.selection.filter(
			(s): s is Obstruction =>
				isObstruction(s) && (s.owner === player || tnt-- > 0),
		);

		// Select the main unit
		const builder = player.sprites.find((s) => isBuilder(s));
		if (builder) player.game.selectionSystem.setSelection([builder]);

		// Kill selected obstructions
		player.game.transmit({
			type: "selfDestruct",
			sprites: obstructions.map((u) => u.id),
		});
	},
	syncHandler: ({ time, sprites, connection }: SelfDestructEvent): void => {
		const mazingContest = currentMazingContest();
		mazingContest.update({ time });
		if (mazingContest.mainLogic.round?.runnerStart) return;

		const player = mazingContest.players.find((p) => p.id === connection);
		if (!player) return;

		mazingContest.entities
			.filter((s): s is Sprite => isSprite(s) && sprites.includes(s.id))
			.forEach((s) => {
				if (s.owner !== player) {
					const check = player.checkResources({ tnt: 1 });
					if (check?.length) {
						appendErrorMessage(`Not enough ${check.join(" ")}`);
						return;
					}
					player.subtractResources({ tnt: 1 });
				}

				s.kill();

				if (s.owner !== player) return;

				// All obstructions cost 1 lumber
				s.owner.resources.lumber = (s.owner.resources.lumber ?? 0) + 1;

				// Thunders cost 1 gold as well
				if (isThunder(s))
					s.owner.resources.gold = (s.owner.resources.gold ?? 0) + 1;
			});
	},
	available: (): boolean =>
		(currentMazingContest().localPlayer.resources.tnt ?? 0) > 0,
};
