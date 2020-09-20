import { emitter, Emitter } from "../core/emitter";
import { Player } from "./players/Player";
import { alea } from "./lib/alea";
import { Settings } from "./types";
import { Network } from "./network";
import { UI } from "../ui/index";
import { initPlayerLogic } from "./players/playerLogic";
import { initSpriteLogicListeners } from "../entities/sprites/spriteLogic";
import { App } from "../core/App";
import { MoveSystem } from "./systems/MoveSystem";
import { AttackSystem } from "./systems/AttackSystem";
import { BlueprintSystem } from "./systems/BlueprintSystem";
import { ProjectileSystem } from "./systems/ProjectileSystem";
import { GerminateSystem } from "./systems/GerminateSystem";
import { AutoAttackSystem } from "./systems/AutoAttackSystem";
import { AnimationSystem } from "./systems/AnimationSystem";
import { SelectedSystem } from "./systems/SelectedSystem";
import { MeshBuilder } from "./systems/MeshBuilder";
import { Terrain } from "../entities/Terrain";
import { ThreeGraphics } from "./systems/ThreeGraphics";
import { ObstructionPlacement } from "./mechanisms/ObstructionPlacement";
import { circleSystems } from "./systems/MovingCircles";
import { Entity } from "../core/Entity";
import { Hotkeys } from "../ui/hotkeys";
import { Mouse } from "./systems/Mouse";
import { withGame, wrapGame } from "./gameContext";
import { isSprite } from "./typeguards";
import { GraphicMoveSystem } from "./systems/GraphicMoveSystem";
import { GraphicTrackPosition } from "./systems/GraphicTrackPosition";
import { PathingMap } from "./pathing/PathingMap";
import { release as releaseColor } from "./players/colors";
import { updateDisplay } from "./players/elo";

type IntervalId = number;
type TimeoutId = number;

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

class Game extends App {
	readonly isGame = true;

	private network!: Network;
	addNetworkListener!: Network["addEventListener"];
	removeNetworkListener!: Network["removeEventListener"];
	connect!: Network["connect"];

	ui!: UI;

	localPlayer!: Player;
	host?: Player;
	players: Player[] = [];
	receivedState: false | "init" | "state" | "host" = false;
	newPlayers = false;
	random = alea("");
	lastUpdate = 0;
	terrain?: Terrain;

	mouse!: Mouse;
	actions!: Hotkeys;

	// Replace with a heap
	intervals: Interval[] = [];
	nextIntervalId = 0;
	timeouts: Timeout[] = [];
	nextTimeoutId = 0;

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

	private _pathingMap?: PathingMap;

	constructor(network: Network) {
		super();
		withGame(this, () => {
			emitter(this);

			this.addSystem(new MoveSystem());
			this.addSystem(new AttackSystem());
			this.addSystem(new BlueprintSystem());
			this.addSystem(new ProjectileSystem());
			this.addSystem(new GerminateSystem());
			this.addSystem(new AutoAttackSystem());
			this.addSystem(new AnimationSystem());
			this.addSystem(new MeshBuilder());
			this.addSystem(new ThreeGraphics(this));
			this.addSystem(new GraphicMoveSystem());
			this.addSystem(new GraphicTrackPosition());
			circleSystems.forEach((CircleSystem) =>
				this.addSystem(new CircleSystem()),
			);
			this.actions = new Hotkeys();
			this.addMechanism(this.actions);

			this.network = network;
			this.addNetworkListener = (event, callback) =>
				this.network.addEventListener(
					event,
					// IDK why this is busted...
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					wrapGame(this, callback as any) as any,
				);
			this.removeNetworkListener = (event, callback) =>
				this.network.removeEventListener(
					event,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					wrapGame(this, callback as any) as any,
				);
			this.connect = this.network.connect.bind(this.network);
			this.addNetworkListener("update", (e) => this.update(e));

			this.ui = new UI();
			this.mouse = new Mouse(this.graphics, this.ui);
			this.addSystem(this.mouse);
			this.addMechanism(new ObstructionPlacement(this));
			this.addSystem(new SelectedSystem());
			initPlayerLogic(this);
			initSpriteLogicListeners(this);
		});
	}

	///////////////////////
	// Network/server interface
	///////////////////////

	/* This should only be used by servers that need to rewrite bits. */
	public get __UNSAFE_network(): Network {
		return this.network;
	}

	transmit<T extends Record<string, unknown>>(data: T): void {
		this.network.send(data);
	}

	get isHost(): boolean {
		return this.network.isHost;
	}

	///////////////////////
	// System getters
	///////////////////////

	get graphics(): ThreeGraphics {
		const sys = this.systems.find((s) => ThreeGraphics.isThreeGraphics(s));
		if (!sys) throw new Error("expected a ThreeGraphics");
		return sys as ThreeGraphics;
	}

	get obstructionPlacement(): ObstructionPlacement {
		const mech = this.mechanisms.find((m) =>
			ObstructionPlacement.isObstructionPlacement(m),
		);
		if (!mech) throw new Error("expected a ObstructionPlacement");
		return mech as ObstructionPlacement;
	}

	get selectionSystem(): SelectedSystem {
		const sys = this.systems.find((s) =>
			SelectedSystem.isSelectedSystem(s),
		);
		if (!sys) throw new Error("expected a SelectedSystem");
		return sys as SelectedSystem;
	}

	get pathingMap(): PathingMap {
		if (!this._pathingMap) throw new Error("expected a PathingMap");
		return this._pathingMap;
	}

	set pathingMap(pathingMap: PathingMap) {
		this._pathingMap = pathingMap;
	}

	///////////////////////
	// Timers
	///////////////////////

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

	///////////////////////
	// Entities
	///////////////////////

	onPlayerLeave(player: Player): void {
		this.players.splice(this.players.indexOf(player), 1);

		player.isHere = false;

		const color = player.color;
		if (color) releaseColor(color);

		updateDisplay(this);
	}

	remove(entity: Entity): boolean {
		if (!this._entities.has(entity)) return false;

		for (const system of this.systems) system.remove(entity);

		entity.clear();
		if (isSprite(entity)) entity.remove(true);

		return true;
	}

	///////////////////////
	// Cycles
	///////////////////////

	render(): void {
		withGame(this, () => this._render());
	}

	protected _update(e: { time: number }): void {
		super._update(e);

		const time = e.time / 1000;
		this.lastUpdate = time;

		this.updateIntervals(time);
		this.updateTimeouts(time);
	}

	update(e: { time: number }): void {
		withGame(this, () => this._update(e));
	}

	toJSON(): {
		arena: number;
		lastUpdate: number;
		players: ReturnType<typeof Player.prototype.toJSON>[];
	} {
		return {
			arena: this.settings.arenaIndex,
			lastUpdate: this.lastUpdate,
			players: this.players.map((p) => p.toJSON()),
		};
	}
}

export type GameEvents = {
	update: (time: number) => void;
	selection: (selection: Entity[]) => void;
};

interface Game extends Emitter<GameEvents>, App {}

export { Game };
