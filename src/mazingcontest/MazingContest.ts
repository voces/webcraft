import { Entity } from "../core/Entity";
import { logLine } from "../core/logger";
import { Terrain } from "../engine/entities/Terrain";
// eslint-disable-next-line no-restricted-imports
import { Game } from "../engine/Game";
import type { Alliances } from "../engine/mechanisms/Alliances";
import { nextColor } from "../engine/players/colors";
import { PathingSystem } from "../engine/systems/PathingSystem";
import { registerNetworkedActionListeners } from "./actions";
import { ForPlayer } from "./components/ForPlayer";
import { IsDone } from "./components/IsDone";
import { MainLogicTimerHook } from "./components/MainLogictimerHook";
import { entityRegistry } from "./entities/registry";
import { isConstructor } from "./helpers";
import { withMazingContest } from "./mazingContestContext";
import type {
	ConnectionEvent,
	MazingContestNetwork,
	NetworkEventCallback,
} from "./MazingContestNetwork";
import { MainLogic } from "./mechanisms/MainLogic";
import {
	getAlliedPlaceholderPlayer,
	getEnemyPlaceholderPlayer,
} from "./players/placeholder";
import { patchInState, Player } from "./players/Player";
import { BuildWatcher } from "./systems/BuildWatcher";
import { RunnerTracker } from "./systems/RunnerTracker";
import { levelSize, terrain } from "./terrain";

class MazingContest extends Game {
	static readonly isMazingContest = true;

	static displayName = "Mazing Contest";
	static protocol = "mazingcontest";

	localPlayer!: Player;
	players: Player[] = [];

	addNetworkListener!: MazingContestNetwork["addEventListener"];
	removeNetworkListener!: MazingContestNetwork["removeEventListener"];

	mainLogic!: MainLogic;
	runnerTracker!: RunnerTracker;
	pathingSystem!: PathingSystem;

	constructor(network: MazingContestNetwork) {
		super(network);
		logLine("Creating MazingContest");
		withMazingContest(this, () => {
			this.addNetworkListener("init", (e) => this.onInit(e));

			// Received by the the upon someone connecting after the round ends
			this.addNetworkListener("state", (e) => this.onState(e));

			this.terrain = new Terrain(terrain);
			this.add(this.terrain);
			this.graphics.panTo(
				{ x: levelSize.height / 2, y: levelSize.width / 2 - 7 },
				0,
			);
			this.pathingSystem = new PathingSystem({
				pathing: terrain.pathing,
				layers: terrain.pathingCliffs.slice().reverse(),
				resolution: 2,
			}).addToApp(this);
			this.mainLogic = new MainLogic().addToApp(this);
			this.runnerTracker = new RunnerTracker().addToApp(this);
			this.addSystem(new BuildWatcher());

			registerNetworkedActionListeners();

			this.registerComponent(ForPlayer);
			this.registerComponent(MainLogicTimerHook);
			this.registerComponent(IsDone);
		});
	}

	private onInit: NetworkEventCallback["init"] = ({
		connections,
		state: { round, entityId, players, entities, alliances },
	}) => {
		if (connections === 0) this.synchronizationState = "synchronized";

		this.mainLogic.round = round;
		this.entityId = entityId;

		patchInState(this, players);

		// Make sure neutrals exist!
		getAlliedPlaceholderPlayer();
		getEnemyPlaceholderPlayer();

		this.alliances.fromJSON(alliances);

		for (const entity of entities) {
			if (entity.id === "TERRAIN") continue;

			if (typeof entity.type === "string") {
				const factory = entityRegistry[entity.type];
				if (!factory) continue;
				if (isConstructor(factory)) {
					if ("fromJSON" in factory)
						if (typeof factory.fromJSON === "function")
							factory.fromJSON(entity);
						else new factory(entity);
				} else factory(entity);
				// Entity doesn't auto-add to App (Sprite does)
			} else this.add(Entity.fromJSON(entity));
		}
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
		});

		return player;
	}

	onPlayerLeave(player: Player): void {
		super.onPlayerLeave(player);
		player.sprites.forEach((s) => s.remove());

		// Clear all entities, except terrain, if no players left
		if (this.players.every((s) => s.id < 0)) {
			logLine("abort round");
			for (const entity of this.entities)
				if (entity.id !== "TERRAIN") this.remove(entity);
			this.mainLogic.round = undefined;
		}

		// Otherwise clear out the player's entities
		for (const entity of this.entities) {
			const forPlayer = entity.get(ForPlayer)[0];
			if (forPlayer && forPlayer.player === player) this.remove(entity);
		}
	}

	private onState: NetworkEventCallback["state"] = ({
		time,
		state: { players },
	}) => {
		this.update({ time });

		patchInState(this, players);

		logLine("synchronized");
		this.synchronizationState = "synchronized";
	};

	///////////////////////
	// Cycles
	///////////////////////

	protected _update(e: { time: number }): void {
		super._update(e);

		const time = e.time / 1000;

		this.dispatchEvent("update", time);
	}

	render(): void {
		withMazingContest(this, () => this._render());
	}

	update(e: { time: number }): void {
		withMazingContest(this, () => this._update(e));
	}

	toJSON(): ReturnType<Game["toJSON"]> & {
		players: ReturnType<Player["toJSON"]>[];
		entities: ReturnType<Entity["toJSON"]>[];
		round: MainLogic["round"];
		alliances: ReturnType<Alliances["toJSON"]>;
	} {
		return {
			...super.toJSON(),
			players: this.players.map((p) => p.toJSON()),
			entities: this.entities.map((e) => e.toJSON()),
			round: this.mainLogic.round,
			alliances: this.alliances.toJSON(),
		};
	}
}

export { MazingContest };
