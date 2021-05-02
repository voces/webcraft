import { Mechanism } from "../../core/Mechanism";
import { currentGame } from "../gameContext";
import type { Player } from "../players/Player";

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
		if (sourcePlayer === targetPlayer) return "ally";
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

	toJSON(): Record<number, Record<number, AllianceState>> {
		const state: ReturnType<Alliances["toJSON"]> = {};
		const players = currentGame().players;
		for (const sourcePlayer of players) {
			const playerRelationships = this.relationships.get(sourcePlayer);
			if (!playerRelationships) continue;
			for (const targetPlayer of players) {
				if (sourcePlayer === targetPlayer) continue;
				const allianceState = playerRelationships.get(targetPlayer);
				if (allianceState) {
					if (!state[sourcePlayer.id]) state[sourcePlayer.id] = {};
					state[sourcePlayer.id][targetPlayer.id] = allianceState;
				}
			}
		}
		return state;
	}

	fromJSON(state: ReturnType<Alliances["toJSON"]>): void {
		const players = currentGame().players;
		for (const sourcePlayerId in state) {
			const sourcePlayer = players.find(
				(p) => p.id === parseInt(sourcePlayerId),
			);
			if (!sourcePlayer)
				throw new Error(
					`Could not hydrate Alliances due to missing player ${sourcePlayerId}`,
				);
			for (const targetPlayerId in state[sourcePlayerId]) {
				const targetPlayer = players.find(
					(p) => p.id === parseInt(targetPlayerId),
				);
				if (!targetPlayer)
					throw new Error(
						`Could not hydrate Alliances due to missing player ${targetPlayerId}`,
					);
				this.set(
					sourcePlayer,
					targetPlayer,
					state[sourcePlayerId][targetPlayerId],
					false,
				);
			}
		}
	}
}
