import { arenas } from "./arenas/index.js";
import { Round } from "./Round.js";
import { TILE_NAMES } from "./constants.js";
import { panTo } from "./players/camera.js";
import { emitter, Emitter } from "./emitter.js";
import { document } from "./util/globals.js";
import { Player } from "./players/Player.js";
import { Arena } from "./arenas/types.js";
import { alea } from "./lib/alea.js";
import { Settings } from "./types.js";

const tilesElemnt = document.getElementById("tiles")!;

const gradient = (
	direction: "top" | "bottom" | "left" | "right",
	first: number,
	second: number,
) =>
	`linear-gradient(to ${direction}, rgba(0,128,0,${
		(10 - first) * 0.1
	}), rgba(0,128,0,${(10 - second) * 0.1}))`;

class Game {
	localPlayer!: Player;
	host?: Player;
	players: Player[] = [];
	arena: Arena = arenas[0];
	receivedState: false | "init" | "state" = false;
	newPlayers = false;
	random = alea("");
	round?: Round;
	lastUpdate = 0;
	lastRoundEnd?: number;

	settings: Settings = {
		arenaIndex: -1,
		crossers: 1,
		duration: 120,
		mode: "bulldog",
		resources: {
			crossers: {
				essence: {
					starting: 100,
					rate: 1,
				},
			},
		},
	};

	constructor() {
		emitter(this);
		this.setArena(Math.floor(this.random() * arenas.length));
	}

	setArena(arenaIndex: number) {
		if (this.settings.arenaIndex === arenaIndex) return;

		this.settings.arenaIndex = arenaIndex;
		this.arena = arenas[arenaIndex];

		tilesElemnt.innerHTML = "";
		for (let y = 0; y < this.arena.tiles.length; y++) {
			const row = document.createElement("div");
			row.classList.add("row");
			for (let x = 0; x < this.arena.tiles[y].length; x++) {
				const tile = document.createElement("div");
				tile.classList.add(
					"tile",
					`layer-${this.arena.layers[y][x]}`,
					TILE_NAMES[this.arena.tiles[y][x]] || "void",
				);

				tile.style.height = "32px";
				tile.style.width = "32px";

				if (
					y !== 0 &&
					this.arena.layers[y][x] < this.arena.layers[y - 1][x]
				)
					if (
						this.arena.layers[y - 1][x] -
							this.arena.layers[y][x] ===
						1
					)
						Object.assign(tile.style, {
							backgroundColor: "transparent",
							backgroundImage: gradient(
								"top",
								this.arena.layers[y][x],
								this.arena.layers[y - 1][x],
							),
						});

				if (
					y < this.arena.tiles.length - 1 &&
					this.arena.layers[y][x] < this.arena.layers[y + 1][x]
				)
					if (
						this.arena.layers[y + 1][x] -
							this.arena.layers[y][x] ===
						1
					)
						Object.assign(tile.style, {
							backgroundColor: "transparent",
							backgroundImage: gradient(
								"bottom",
								this.arena.layers[y][x],
								this.arena.layers[y + 1][x],
							),
						});

				if (
					x !== 0 &&
					this.arena.layers[y][x] < this.arena.layers[y][x - 1]
				)
					if (
						this.arena.layers[y][x - 1] -
							this.arena.layers[y][x] ===
						1
					)
						Object.assign(tile.style, {
							backgroundColor: "transparent",
							backgroundImage: gradient(
								"left",
								this.arena.layers[y][x],
								this.arena.layers[y][x - 1],
							),
						});

				if (
					x < this.arena.tiles[y].length - 1 &&
					this.arena.layers[y][x] < this.arena.layers[y][x + 1]
				)
					if (
						this.arena.layers[y][x + 1] -
							this.arena.layers[y][x] ===
						1
					)
						Object.assign(tile.style, {
							backgroundColor: "transparent",
							backgroundImage: gradient(
								"right",
								this.arena.layers[y][x],
								this.arena.layers[y][x + 1],
							),
						});

				row.appendChild(tile);
			}

			tilesElemnt.appendChild(row);
		}

		panTo({
			x: this.arena.tiles[0].length / 2,
			y: this.arena.tiles.length / 2,
			duration: 0,
		});
	}

	nextArena() {
		this.settings.arenaIndex =
			(this.settings.arenaIndex + 1) % arenas.length;
	}

	previousArena() {
		this.settings.arenaIndex = this.settings.arenaIndex
			? this.settings.arenaIndex - 1
			: arenas.length - 1;
	}

	start({ time }: { time: number }) {
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

		this.round = new Round({
			time,
			settings: this.settings,
			players: this.players,
		});
	}

	update(e: { time: number }) {
		const time = e.time / 1000;
		this.lastUpdate = time;

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

	toJSON() {
		return {
			arena: this.settings.arenaIndex,
			lastRoundEnd: this.lastRoundEnd,
			lastUpdate: this.lastUpdate,
			players: this.players.map((p) => p.toJSON()),
			round: this.round?.toJSON(),
		};
	}
}

type GameEvents = {
	update: (time: number) => void;
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Game extends Emitter<GameEvents> {}

export { Game };
