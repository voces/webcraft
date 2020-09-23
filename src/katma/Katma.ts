import { Entity } from "../core/Entity";
import { Terrain } from "../engine/entities/Terrain";
// eslint-disable-next-line no-restricted-imports
import { Game } from "../engine/Game";
import { nextColor } from "../engine/players/colors";
import { isSprite } from "../engine/typeguards";
import { arenas } from "./arenas";
import { Arena } from "./arenas/types";
import { withKatma } from "./katmaContext";
import {
	ConnectionEvent,
	KatmaNetwork,
	NetworkEventCallback,
} from "./KatmaNetwork";
import { updateDisplay } from "./players/elo";
import { getPlaceholderPlayer } from "./players/placeholder";
import { patchInState, Player } from "./players/Player";
import { Round } from "./Round";
import { Settings } from "./types";

export class Katma extends Game {
	static readonly isKatma = true;

	arena: Arena = arenas[0];
	round?: Round;
	lastRoundEnd?: number;
	localPlayer!: Player;
	players: Player[] = [];

	settings: Settings = {
		arenaIndex: -1,
		crossers: 1,
		duration: 120,
		mode: "bulldog",
		resources: {
			crossers: { essence: { starting: 100, rate: 1 } },
			defenders: { essence: { starting: 0, rate: 0 } },
		},
	};

	addNetworkListener!: KatmaNetwork["addEventListener"];
	removeNetworkListener!: KatmaNetwork["removeEventListener"];

	constructor(network: KatmaNetwork) {
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

	onPlayerJoin(data: ConnectionEvent): Player {
		const player = new Player({
			color: nextColor(),
			game: this,
			id: data.connection,
			username: data.username,
			crosserPlays: Math.max(
				0,
				...this.players.map((p) => p.crosserPlays),
			),
		});

		updateDisplay(this);

		return player;
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

		const players =
			this.players.length === 1
				? [...this.players, getPlaceholderPlayer()]
				: this.players;
		const plays = players[0].crosserPlays;
		const newArena =
			plays >= 3 &&
			players.every(
				(p) => p.crosserPlays === plays || p.crosserPlays >= 5,
			);
		if (newArena) {
			this.setArena(Math.floor(this.random() * arenas.length));
			players.forEach((p) => (p.crosserPlays = 0));
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
			...super.toJSON(),
			arena: this.settings.arenaIndex,
			lastRoundEnd: this.lastRoundEnd,
			players: this.players.map((p) => p.toJSON()),
			round: this.round?.toJSON(),
		};
	}
}
