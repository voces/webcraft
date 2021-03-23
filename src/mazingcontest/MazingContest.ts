import { logLine } from "../core/logger";
import { Terrain } from "../engine/entities/Terrain";
// eslint-disable-next-line no-restricted-imports
import { Game } from "../engine/Game";
import { PathingMap } from "../engine/pathing/PathingMap";
import { nextColor } from "../engine/players/colors";
import { registerNetworkedActionListeners } from "./actions";
import { withMazingContest } from "./mazingContestContext";
import type {
	ConnectionEvent,
	MazingContestNetwork,
	NetworkEventCallback,
} from "./MazingContestNetwork";
import { MainLogic } from "./mechanisms/MainLogic";
import { patchInState, Player } from "./players/Player";
import { BuildWatcher } from "./systems/BuildWatcher";
import { RunnerTracker } from "./systems/RunnerTracker";
import { terrain } from "./terrain";
import type { Settings } from "./types";

class MazingContest extends Game {
	static readonly isMazingContest = true;

	localPlayer!: Player;
	players: Player[] = [];

	settings: Settings = {
		numberOfRounds: 10,
		buildTime: 150,
		thunderTowers: true,
		checkpoints: true,
	};

	addNetworkListener!: MazingContestNetwork["addEventListener"];
	removeNetworkListener!: MazingContestNetwork["removeEventListener"];

	displayName = "Mazing Contest";
	protocol = "mazingcontest";

	mainLogic!: MainLogic;
	runnerTracker!: RunnerTracker;

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
				{ x: terrain.height / 2, y: terrain.width / 2 - 7 },
				0,
			);
			this.pathingMap = new PathingMap({
				pathing: terrain.pathing,
				layers: terrain.pathingCliffs.slice().reverse(),
				resolution: 2,
			});
			this.mainLogic = new MainLogic().addToApp(this);
			this.runnerTracker = new RunnerTracker().addToApp(this);
			this.addSystem(new BuildWatcher());

			registerNetworkedActionListeners();
		});
	}

	private onInit: NetworkEventCallback["init"] = ({
		connections,
		state: { players: inputPlayers },
	}) => {
		if (connections === 0) this.synchronizationState = "synchronized";

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
		});

		return player;
	}

	private onState: NetworkEventCallback["state"] = ({
		time,
		state: { players: inputPlayers },
	}) => {
		this.update({ time });

		patchInState(this, inputPlayers);

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
	} {
		return {
			...super.toJSON(),
			players: this.players.map((p) => p.toJSON()),
		};
	}
}

export { MazingContest };
