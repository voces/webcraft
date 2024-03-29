import { App } from "../core/App";
import type { Emitter } from "../core/emitter";
import { emitter } from "../core/emitter";
import type { Entity } from "../core/Entity";
import { initSpriteLogicListeners } from "./actions/spriteLogic";
import type { TerrainInterface } from "./entities/Terrain";
import type { Obstruction } from "./entities/widgets/sprites/units/Obstruction";
import { withGame, wrapGame } from "./gameContext";
import { alea } from "./lib/alea";
import { Alliances } from "./mechanisms/Alliances";
import { FPSMonitor } from "./mechanisms/FPSMonitor";
import { ObstructionPlacement } from "./mechanisms/ObstructionPlacement";
import type { ConnectionEvent, Network } from "./Network";
import { nextColor, releaseColor } from "./players/colors";
import { Player } from "./players/Player";
import { initPlayerLogic } from "./players/playerLogic";
import { AnimationSystem } from "./systems/AnimationSystem";
import { AttackSystem } from "./systems/AttackSystem";
import { AutoAttackSystem } from "./systems/AutoAttackSystem";
import { BlueprintSystem } from "./systems/BlueprintSystem";
import { GerminateSystem } from "./systems/GerminateSystem";
import { GraphicMoveSystem } from "./systems/GraphicMoveSystem";
import { GraphicTrackPosition } from "./systems/GraphicTrackPosition";
import { MeshBuilder } from "./systems/MeshBuilder";
import { Mouse } from "./systems/Mouse";
import { MoveSystem } from "./systems/MoveSystem";
import { circleSystems } from "./systems/MovingCircles";
import type { PathingSystem } from "./systems/PathingSystem";
import { ProjectileSystem } from "./systems/ProjectileSystem";
import { SelectedSystem } from "./systems/SelectedSystem";
import { ThreeGraphics } from "./systems/ThreeGraphics";
import { TimerSystem } from "./systems/TimerSystem";
import { TimerWindows } from "./systems/TimerWindows";
import { isSprite } from "./typeguards";
import { Hotkeys } from "./ui/hotkeys";
import { UI } from "./ui/index";

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
	static readonly isGame = true;

	// eslint-disable-next-line no-restricted-syntax
	static displayName = Math.random().toString();
	// eslint-disable-next-line no-restricted-syntax
	static protocol = Math.random().toString();

	get displayName(): string {
		let displayName = (this.constructor as typeof Game).displayName;

		if (!displayName || displayName === Game.displayName) {
			console.warn(
				"Game.displayName undefined, falling back to class name",
			);
			(this.constructor as typeof Game).displayName =
				this.constructor.name;
			displayName = this.constructor.name;
		}

		return displayName;
	}

	get protocol(): string {
		let protocol = (this.constructor as typeof Game).protocol;

		if (!protocol || protocol === Game.protocol) {
			console.warn("Game.protocol undefined, falling back to class name");
			(this.constructor as typeof Game).protocol =
				this.constructor.name.toLowerCase();
			protocol = this.constructor.name.toLowerCase();
		}

		return protocol;
	}

	private network!: Network;
	addNetworkListener!: Network["addEventListener"];
	removeNetworkListener!: Network["removeEventListener"];
	connect!: Network["connect"];

	ui!: UI;

	localPlayer!: Player;
	host?: Player;
	players: Player[] = [];
	synchronizationState: "synchronizing" | "synchronized" = "synchronizing";
	newPlayers = false;
	random = alea("");
	lastUpdate = 0;
	terrain?: TerrainInterface;

	// Systems/mechanisms
	mouse!: Mouse;
	actions!: Hotkeys;
	obstructionPlacement!: ObstructionPlacement;
	graphics!: ThreeGraphics;
	selectionSystem!: SelectedSystem;
	alliances!: Alliances;
	fpsMonitor!: FPSMonitor;
	timerWindows!: TimerWindows;
	pathingSystem?: PathingSystem;

	// Replace with a heap
	intervals: Interval[] = [];
	nextIntervalId = 0;
	timeouts: Timeout[] = [];
	nextTimeoutId = 0;

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
			this.addSystem(new TimerSystem());
			this.fpsMonitor = new FPSMonitor().addToApp(this);
			this.timerWindows = new TimerWindows().addToApp(this);
			this.graphics = new ThreeGraphics(this).addToApp(this);
			this.addSystem(new GraphicMoveSystem());
			this.addSystem(new GraphicTrackPosition());
			circleSystems.forEach((CircleSystem) =>
				this.addSystem(new CircleSystem()),
			);
			this.actions = new Hotkeys().addToApp(this);

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

			this.mouse = new Mouse(this.graphics, this.ui).addToApp(this);
			this.obstructionPlacement = new ObstructionPlacement(this).addToApp(
				this,
			);
			this.selectionSystem = new SelectedSystem().addToApp(this);
			this.alliances = new Alliances().addToApp(this);

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
			next: this.time + interval,
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

		this.timeouts.push({ fn, next: this.time + timeout, id });

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

	onPlayerJoin(data: ConnectionEvent): Player {
		return new Player({
			color: nextColor(),
			game: this,
			id: data.connection,
			username: data.username,
		});
	}

	onPlayerLeave(player: Player): void {
		this.players.splice(this.players.indexOf(player), 1);

		player.isHere = false;

		const color = player.color;
		if (color) releaseColor(color);
	}

	remove(entity: Entity): boolean {
		if (!this._entities.has(entity)) return false;

		for (const system of this.allSystems) system.remove(entity);

		entity.clear();
		if (isSprite(entity)) entity.remove(true);
		if (this.obstructionPlacement.builder === entity)
			this.obstructionPlacement.stop();
		this._entities.delete(entity);

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
		lastUpdate: number;
		players: ReturnType<typeof Player.prototype.toJSON>[];
		entityId: number;
	} {
		return {
			lastUpdate: this.lastUpdate,
			players: this.players.map((p) => p.toJSON()),
			entityId: this.entityId,
		};
	}
}

export type GameEvents = {
	update: (time: number) => void;
	selection: (selection: Entity[]) => void;
	build: (builder: Entity, obstruction: Obstruction) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: (...args: any[]) => void;
};

interface Game extends Emitter<GameEvents>, App {}

export { Game };
