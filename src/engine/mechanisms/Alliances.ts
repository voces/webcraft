import { Mechanism } from "../../core/Merchanism";
import { Player } from "../players/Player";

type AllianceState = "ally" | "neutral" | "enemy";

export class Alliances extends Mechanism {
	private relationships = new WeakMap<
		Player,
		WeakMap<Player, AllianceState>
	>();

	private getPlayerRelationships(player: Player) {
		{
			const playerRelationships = this.relationships.get(player);
			if (playerRelationships) return playerRelationships;
		}

		const playerRelationships = new WeakMap<Player, AllianceState>();
		this.relationships.set(player, playerRelationships);
		return playerRelationships;
	}

	set(
		sourcePlayer: Player,
		targetPlayer: Player,
		allianceState: AllianceState,
		mutual = true,
	): void {
		const sourcePlayerRelationships = this.getPlayerRelationships(
			sourcePlayer,
		);
		sourcePlayerRelationships.set(targetPlayer, allianceState);

		if (mutual) {
			const targetPlayerRelationships = this.getPlayerRelationships(
				targetPlayer,
			);
			targetPlayerRelationships.set(sourcePlayer, allianceState);
		}
	}

	allianceState(sourcePlayer: Player, targetPlayer: Player): AllianceState {
		return (
			this.relationships.get(sourcePlayer)?.get(targetPlayer) ?? "neutral"
		);
	}

	isAlly(sourcePlayer: Player, targetPlayer: Player): boolean {
		return this.allianceState(sourcePlayer, targetPlayer) === "ally";
	}

	isEnemy(sourcePlayer: Player, targetPlayer: Player): boolean {
		return this.allianceState(sourcePlayer, targetPlayer) === "enemy";
	}
}
