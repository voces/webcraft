import { Entity } from "../core/Entity";
import { Game } from "../engine/Game";
import { NetworkEventCallback } from "../engine/Network";
import { patchInState, Player } from "../engine/players/Player";
import { isSprite } from "../engine/typeguards";
import { Terrain } from "../entities/Terrain";
import { Network } from "../server";
import { arenas } from "./arenas";
import { Arena } from "./arenas/types";
import { Round } from "./Round";
import { withKatma } from "./katmaContext";
import { updateDisplay } from "../engine/players/elo";

export class Katma extends Game {
	readonly isKatma = true;

	arena: Arena = arenas[0];
	round?: Round;
	lastRoundEnd?: number;

	constructor(network: Network) {
		super(network);
		withKatma(this, () => {
			this.addNetworkListener("init", (e) => this.onInit(e));
			this.setArena(Math.floor(this.random() * arenas.length));

			// Received by the the upon someone connecting after the round ends
			this.addNetworkListener("state", (e) => this.onPlayerState(e));
		});
	}

	private onInit: NetworkEventCallback["init"] = ({
		connections,
		state: { players: inputPlayers, arena },
	}) => {
		if (connections === 0) this.receivedState = "init";

		this.setArena(arena);

		patchInState(this, inputPlayers);
	};

	///////////////////////
	// Entities
	///////////////////////

	onPlayerLeave(player: Player): void {
		super.onPlayerLeave(player);

		if (this.round && !this.players.some((player) => player.isHere))
			this.round = undefined;
	}

	private onPlayerState: NetworkEventCallback["state"] = ({
		time,
		state: { arena, players: inputPlayers },
	}) => {
		this.update({ time });

		patchInState(this, inputPlayers);

		this.setArena(arena);
		this.receivedState = "state";
		this.lastRoundEnd = time / 1000;
		// game.random = new Random( time );

		updateDisplay(this);
	};

	add(entity: Entity): boolean {
		if (!super.add(entity)) return false;
		if (this.round && isSprite(entity)) this.round.sprites.push(entity);

		return true;
	}

	///////////////////////
	// Arenas
	///////////////////////

	setArena(arenaIndex: number): void {
		if (this.settings.arenaIndex === arenaIndex) return;

		this.settings.arenaIndex = arenaIndex;
		this.arena = arenas[arenaIndex];

		if (this.terrain) this.remove(this.terrain);
		this.terrain = new Terrain(this.arena);
		this.add(this.terrain);

		this.graphics.panTo(
			{
				x: this.arena.tiles[0].length / 2,
				y: this.arena.tiles.length / 2,
			},
			0,
		);
	}

	nextArena(): void {
		this.settings.arenaIndex =
			(this.settings.arenaIndex + 1) % arenas.length;
	}

	previousArena(): void {
		this.settings.arenaIndex = this.settings.arenaIndex
			? this.settings.arenaIndex - 1
			: arenas.length - 1;
	}

	///////////////////////
	// Rounds
	///////////////////////

	start({ time }: { time: number }): void {
		if (this.round) throw new Error("A round is already in progress");

		const plays = this.players[0].crosserPlays;
		const newArena =
			plays >= 3 &&
			this.players.every(
				(p) => p.crosserPlays === plays || p.crosserPlays >= 5,
			);

		if (newArena) {
			this.setArena(Math.floor(this.random() * arenas.length));
			this.players.forEach((p) => (p.crosserPlays = 0));
		}

		this.settings.crossers =
			this.players.length === 3
				? 1 // hardcode 1v2
				: Math.ceil(this.players.length / 2); // otherwise just do 1v0, 1v1, 1v2, 2v2, 3v2, 3v3, 4v3, etc

		new Round({
			time,
			settings: this.settings,
			players: this.players,
		});
	}

	///////////////////////
	// Cycles
	///////////////////////

	protected _update(e: { time: number }): void {
		super._update(e);

		const time = e.time / 1000;

		// Update is called for people who have recently joined
		if (this.round) {
			this.round.update(time);
			this.dispatchEvent("update", time);
			return;
		}

		if (
			this.players.length &&
			this.receivedState &&
			(!this.lastRoundEnd || time > this.lastRoundEnd + 2)
		)
			this.start({ time });
	}

	render(): void {
		withKatma(this, () => this._render());
	}

	update(e: { time: number }): void {
		withKatma(this, () => this._update(e));
	}

	toJSON(): {
		arena: number;
		lastRoundEnd: number | undefined;
		lastUpdate: number;
		players: ReturnType<typeof Player.prototype.toJSON>[];
		round: ReturnType<typeof Round.prototype.toJSON> | undefined;
	} {
		return {
			arena: this.settings.arenaIndex,
			lastRoundEnd: this.lastRoundEnd,
			lastUpdate: this.lastUpdate,
			players: this.players.map((p) => p.toJSON()),
			round: this.round?.toJSON(),
		};
	}
}
