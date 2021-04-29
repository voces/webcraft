import { Component } from "../../core/Component";
import type { Entity } from "../../core/Entity";
import type { Mutable } from "../../engine/types";
import { currentMazingContest } from "../mazingContestContext";
import type { Player } from "../players/Player";

export class ForPlayer extends Component<[player: Player]> {
	readonly player!: Player;

	initialize(player: Player): void {
		const mutable: Mutable<ForPlayer> = this;
		mutable.player = player;
	}

	toJSON(): { type: string; player: number } {
		return { type: this.constructor.name, player: this.player.id };
	}

	static fromJSON(entity: Entity, { player }: { player: number }): ForPlayer {
		const mazingContest = currentMazingContest();
		return new ForPlayer(
			entity,
			mazingContest.players.find((p) => p.id === player)!,
		);
	}
}
