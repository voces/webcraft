import { arenas } from "./arenas/index";
import { PathingMap } from "./pathing/PathingMap";
import { TILE_TYPES, TileType } from "./constants";
import { Crosser } from "./entities/sprites/Crosser";
import { Defender } from "./entities/sprites/Defender";
import { elo, updateDisplay } from "./players/elo";
import { emitter, Emitter } from "./emitter";
import { Player } from "./players/Player";
import { colors } from "./players/colors";
import { Resource } from "./entities/sprites/obstructions/index";
import { Settings, teamKeys, resourceKeys } from "./types";
import { Arena } from "./arenas/types";
import { Unit } from "./entities/sprites/Unit";
import { Sprite } from "./entities/sprites/Sprite";
import { Game } from "./Game";
import { TileSystem } from "./systems/TileSystem";
import { SceneObjectComponent } from "./components/graphics/SceneObjectComponent";

let placeholderPlayer: Player;

type Interval = {
	fn: () => void;
	next: number;
	interval: number;
	oncePerUpdate: boolean;
	id: number;
};

type Timeout = {
	fn: () => void;
	next: number;
	id: number;
};

type IntervalId = number;
type TimeoutId = number;

// A round starts upon construction
class Round {
	game: Game;
	players: Player[];
	crossers: Player[] = [];
	defenders: Player[] = [];
	sprites: Sprite[] = [];
	scores = 0;
	spriteId = 0;
	// Replace with a heap
	intervals: Interval[] = [];
	nextIntervalId = 0;
	timeouts: Timeout[] = [];
	nextTimeoutId = 0;

	lastUpdate: number;
	settings: Settings;
	arena: Arena;
	pathingMap: PathingMap;
	expireAt: number;

	private tileSystem: TileSystem;

	constructor({
		time,
		settings,
		players,
		game,
	}: {
		time: number;
		settings: Settings;
		players: Player[];
		game: Game;
	}) {
		emitter(this);
		this.game = game;
		// We set this for downstream constructor logic
		this.game.round = this;
		this.lastUpdate = time;
		this.settings = settings;
		this.players = [...players];
		this.arena = arenas[settings.arenaIndex];
		this.pathingMap = new PathingMap({
			pathing: this.arena.pathing.slice().reverse(),
			layers: this.arena.pathingCliffs.slice().reverse(),
			resolution: 2,
		});
		this.expireAt = time + settings.duration;
		this.tileSystem = new TileSystem();
		this.game.addSystem(this.tileSystem);

		if (!placeholderPlayer)
			placeholderPlayer = new Player({
				color: colors.white,
				id: -1,
				score: { bulldog: 800 },
				game,
			});

		this.pickTeams();
		this.grantResources();
		this.spawnUnits();
	}

	pickTeams(): void {
		if (this.players.length === 1) this.players.push(placeholderPlayer);

		const remaining = [...this.players];
		while (remaining.length) {
			const lowPlays = Math.min(...remaining.map((p) => p.crosserPlays));
			const low = remaining.filter((p) => p.crosserPlays === lowPlays);

			const player = low.splice(
				Math.floor(this.game.random() * low.length),
				1,
			)[0];
			remaining.splice(remaining.indexOf(player), 1);
			if (this.crossers.length < this.settings.crossers) {
				this.crossers.push(player);
				player.crosserPlays++;
			} else this.defenders.push(player);
		}

		updateDisplay(this.game);
	}

	grantResources(): void {
		for (const team of teamKeys)
			if (team in this.settings.resources)
				this[team].forEach((player) => {
					for (const resource of resourceKeys)
						player.resources[resource] = this.settings.resources[
							team
						][resource].starting;
				});
	}

	_spawnUnit(
		player: Player,
		UnitClass: typeof Unit,
		targetTile: TileType,
	): void {
		// Create the unit
		const unit = (player.unit = new UnitClass({
			owner: player,
			x: 0,
			y: 0,
		}));

		// Place it
		let maxTries = 8192;
		while (--maxTries) {
			const xRand = this.game.random() * this.pathingMap.widthWorld;
			const yRand = this.game.random() * this.pathingMap.heightWorld;

			if (
				this.arena.tiles[Math.floor(yRand)][Math.floor(xRand)] !==
				targetTile
			)
				continue;

			const { x, y } = this.pathingMap.nearestSpiralPathing(
				xRand,
				yRand,
				unit,
			);

			if (this.arena.tiles[Math.floor(y)][Math.floor(x)] === targetTile) {
				unit.position.setXY(x, y);
				this.pathingMap.addEntity(unit);

				break;
			}
		}

		if (!maxTries) console.error("Exhausted placement attempts");

		// Select + pan to it
		if (player === this.game.localPlayer) {
			this.game.selectionSystem.select(unit);
			this.game.graphics.panTo(unit.position, 0);
		}

		// Add event listeners
		if (player)
			unit.addEventListener("death", () => {
				player.unit = undefined;
				if (unit instanceof Crosser) this.onCrosserRemoval();
			});
	}

	ball(x: number, y: number): Sprite {
		const radius = 0.25;
		const sprite = new Sprite({
			graphic: { shape: "circle" },
			x,
			y,
			game: this.game,
			radius,
		});
		const mesh = SceneObjectComponent.get(sprite)!.object;
		mesh.position.z = this.game.terrain!.groundHeight(x, y);
		return sprite;
	}

	spawnUnits(): void {
		this.players.forEach((player) => {
			const isCrosser = this.crossers.includes(player);
			const targetTile = isCrosser ? TILE_TYPES.START : TILE_TYPES.SPAWN;
			const Unit = isCrosser ? Crosser : Defender;
			this._spawnUnit(player, Unit, targetTile);
			// if (isCrosser)
			// 	for (let i = 0; i < 30; i++)
			// 		this._spawnUnit(player, Unit, targetTile);
			// else this._spawnUnit(player, Unit, targetTile);
		});
		[
			{ x: 0, y: 0 },
			{ x: 0, y: this.game.arena.height },
			{ x: this.game.arena.width, y: 0 },
			{
				x: this.game.arena.width,
				y: this.game.arena.height,
			},
		].forEach(({ x, y }) => this.ball(x, y));
	}

	onCrosserRemoval(): void {
		if (this.crossers.some((p) => p.unit && p.unit.health > 0)) return;

		this.end();
	}

	end(): void {
		elo({
			mode: this.game.settings.mode,
			crossers: this.crossers,
			defenders: this.defenders,
			scores: this.scores,
			game: this.game,
		});

		const placeholderIndex = this.game.players.indexOf(placeholderPlayer);
		if (placeholderIndex >= 0)
			this.game.players.splice(placeholderIndex, 1);

		if (this.game.newPlayers) {
			this.game.newPlayers = false;
			this.game.receivedState = false;

			if (this.game.isHost)
				this.game.transmit({
					type: "state",
					state: this.game,
				});
		} else this.game.lastRoundEnd = this.game.lastUpdate;

		this.setTimeout(() => {
			[...this.sprites].forEach((sprite) => sprite.kill());

			this.setTimeout(() => {
				this.game.removeSystem(this.tileSystem);
				this.removeEventListeners();
				this.game.round = undefined;
			}, 0.25);
		}, 1);
	}

	setInterval(
		fn: () => void,
		interval = 0.05,
		oncePerUpdate = true,
	): IntervalId {
		const id = this.nextIntervalId;

		this.intervals.push({
			fn,
			next: this.lastUpdate + interval,
			interval,
			oncePerUpdate,
			id,
		});

		this.nextIntervalId = id + 1;

		return id;
	}

	clearInterval(id: number): void {
		const index = this.intervals.findIndex((i) => i.id === id);
		if (index >= 0) this.intervals.splice(index, 1);
	}

	setTimeout(fn: () => void, timeout = 0.05): TimeoutId {
		const id = this.nextTimeoutId;

		this.timeouts.push({ fn, next: this.lastUpdate + timeout, id });

		this.nextTimeoutId = id + 1;

		return id;
	}

	clearTimeout(id: number): void {
		const index = this.timeouts.findIndex((i) => i.id === id);
		if (index >= 0) this.timeouts.splice(index, 1);
	}

	onPlayerLeave(/* player: Player */): void {
		if (this.players.some((player) => player.isHere)) return;

		this.game.round = undefined;
	}

	updateIntervals(time: number): void {
		this.intervals.sort((a, b) => a.next - b.next);
		const intervals = [...this.intervals];
		let intervalIndex = 0;
		while (
			intervals[intervalIndex] &&
			intervals[intervalIndex].next < time
		) {
			const interval = intervals[intervalIndex];
			interval.next = interval.oncePerUpdate
				? time + interval.interval
				: interval.next + interval.interval;
			interval.fn();
			if (interval.oncePerUpdate || interval.next > time) intervalIndex++;
		}
	}

	updateTimeouts(time: number): void {
		this.timeouts.sort((a, b) => a.next - b.next);
		const timeouts = [...this.timeouts];
		let timeoutIndex = 0;
		while (timeouts[timeoutIndex] && timeouts[timeoutIndex].next < time) {
			const timeout = timeouts[timeoutIndex];
			timeout.fn();
			timeoutIndex++;
			const index = this.timeouts.indexOf(timeout);
			if (index >= 0) this.timeouts.splice(index, 1);
		}
	}

	updateResources(delta: number): void {
		const factor =
			this.crossers.reduce(
				(sum, p) =>
					sum +
					p.sprites.reduce(
						(sum, s) => sum + (s instanceof Resource ? 1 : 0),
						0,
					),
				1,
			) / 2;

		for (const team of teamKeys)
			if (team in this.settings.resources)
				this[team].forEach((player) => {
					for (const resource of resourceKeys)
						player.resources[resource] +=
							this.settings.resources[team][resource].rate *
							delta *
							factor;
				});
	}

	update(time: number): void {
		// meta info
		const delta = time - this.lastUpdate;
		if (isNaN(delta)) throw new Error(`delta=${delta}`);
		this.lastUpdate = time;

		// End of round
		if (time > this.expireAt)
			this.crossers.forEach((c) => c.unit && c.unit.kill());

		this.updateIntervals(time);
		this.updateTimeouts(time);
		this.updateResources(delta);
	}

	toJSON(): {
		crossers: number[];
		defenders: number[];
		expireAt: number;
		lastUpdate: number;
		sprites: ReturnType<typeof Sprite.prototype.toJSON>[];
	} {
		return {
			crossers: this.crossers.map((c) => c.id),
			defenders: this.defenders.map((d) => d.id),
			expireAt: this.expireAt,
			lastUpdate: this.lastUpdate,
			sprites: this.sprites.map((s) => s.toJSON()),
		};
	}
}

type RoundEvents = {
	empty: never;
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Round extends Emitter<RoundEvents> {}

export { Round };
