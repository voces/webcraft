import { Entity } from "../../core/Entity";
import { logLine } from "../../core/logger";
import { Mechanism } from "../../core/Merchanism";
import { PathingComponent } from "../../engine/components/PathingComponent";
import { Timer } from "../../engine/components/Timer";
import { TimerWindow } from "../../engine/components/TimerWindow";
import type { Unit } from "../../engine/entities/widgets/sprites/Unit";
import { isUnit } from "../../engine/typeguards";
import { ForPlayer } from "../components/ForPlayer";
import { IsDone } from "../components/IsDone";
import { MainLogicTimerHook } from "../components/MainLogictimerHook";
import { Block } from "../entities/Block";
import { Builder } from "../entities/Builder";
import { Checkpoint } from "../entities/Checkpoint";
import { Runner } from "../entities/Runner";
import { Thunder } from "../entities/Thunder";
import { getCheckpoint, isPathable } from "../helpers";
import type { MazingContest } from "../MazingContest";
import { currentMazingContest } from "../mazingContestContext";
import {
	getAlliedPlaceholderPlayer,
	getEnemyPlaceholderPlayer,
} from "../players/placeholder";
import type { Player } from "../players/Player";
import { center, offset, spawn, target } from "../terrain";
import { isRunner } from "../typeguards";

const spawnCheckpoint = (game: MazingContest) => {
	const firstPlayer = game.players.find((p) => p.id >= 0)!;
	const firstPlayerIndex = firstPlayer.color!.index;
	const lCenter = center(firstPlayerIndex);
	const x = lCenter.x + Math.round(game.random.between(-9, 8)) + 0.5;
	const y = lCenter.y + Math.round(game.random.between(-9, 8)) + 0.5;

	const entity = new Checkpoint({
		x,
		y,
		owner: getAlliedPlaceholderPlayer(),
	});
	new ForPlayer(entity, firstPlayer);

	const newPos = game.pathingSystem.nearestSpiralPathing(x, y, entity);
	if (game.pathingSystem.pathable(entity, x, y)) {
		entity.position.setXY(newPos.x, newPos.y);
		new PathingComponent(entity);

		for (const player of game.players) {
			if (player.id <= firstPlayer.id) continue;
			const lOffset = offset(player.color!.index);
			const clone = new Checkpoint({
				x: newPos.x + lOffset.x,
				y: newPos.y + lOffset.y,
				owner: entity.owner,
			});
			new ForPlayer(clone, player);
			new PathingComponent(clone);
		}
	} else throw new Error("Unable to place Checkpooint!");
};

const spawnUnits = (
	game: MazingContest,
	count: number,
	factory: (props: { x: number; y: number; owner: Player }) => Unit,
) => {
	const firstPlayer = game.players.find((p) => p.id >= 0)!;
	const firstPlayerIndex = firstPlayer.color!.index;
	const lCenter = center(firstPlayerIndex);
	while (count--) {
		const x = lCenter.x + Math.round(game.random.between(-9, 8));
		const y = lCenter.y + Math.round(game.random.between(-9, 8));

		const entity = factory({
			x,
			y,
			owner: getAlliedPlaceholderPlayer(),
		});

		const newPos = game.pathingSystem.nearestSpiralPathing(x, y, entity);

		if (game.pathingSystem.pathable(entity, newPos.x, newPos.y)) {
			entity.position.setXY(newPos.x, newPos.y);
			new PathingComponent(entity);

			if (!isPathable(firstPlayerIndex)) entity.remove();
			else {
				new ForPlayer(entity, firstPlayer);
				for (const player of game.players) {
					if (player.id <= firstPlayer.id) continue;
					const lOffset = offset(player.color!.index);
					const clone = factory({
						x: newPos.x + lOffset.x,
						y: newPos.y + lOffset.y,
						owner: getAlliedPlaceholderPlayer(),
					});
					new ForPlayer(clone, player);
					new PathingComponent(clone);
				}
			}
		} else entity.remove();
	}
};

const spawnBlocks = (game: MazingContest) => {
	const count = Math.floor(game.random() * game.random() * 25);
	spawnUnits(game, count, (props) => new Block(props));
};

const spawnThunders = (game: MazingContest) => {
	const count = Math.floor(game.random() * game.random() * 4);
	spawnUnits(game, count, (props) => new Thunder(props));
};

const derivedCallback = () => {
	const mazingContest = currentMazingContest();
	return () => mazingContest.mainLogic.startRunners();
};

export class MainLogic extends Mechanism {
	phase: "idle" | "build" | "run" = "idle";
	round?: {
		players: number[];
		buildStart: number;
		runnerStart?: number;
	};
	timer?: Entity;
	derivedCallback: number;

	constructor() {
		super();
		this.derivedCallback = Timer.registerDerviedCallback(derivedCallback);
	}

	startRunners(): void {
		if (!this.timer || !this.round) return;

		const game = currentMazingContest();
		logLine("startRunners", game.time);

		game.remove(this.timer);
		this.round.runnerStart = game.time;

		game.players.forEach((p) => {
			if (p.id < 0) return;
			const builder = p.sprites.find((s) => s instanceof Builder);
			if (builder) builder.kill();
		});

		for (const player of game.players) {
			if (!this.round.players.includes(player.id)) continue;
			const u = new Runner({
				...spawn(player.color!.index),
				owner: getEnemyPlaceholderPlayer(),
			});
			new ForPlayer(u, player);
			new PathingComponent(u);

			let lTarget = target(player.color!.index);
			const checkpoint = getCheckpoint(player.color!.index);
			if (checkpoint)
				lTarget = {
					x: checkpoint.position.x,
					y: checkpoint.position.y,
				};
			u.walkTo(lTarget);
		}
	}

	private startRound(time: number, game: MazingContest) {
		logLine("startRound", time);
		this.round = {
			buildStart: time,
			players: game.players.map((p) => p.id).filter((v) => v >= 0),
		};

		const gold = Math.floor((game.random() * game.random()) ** (1 / 2) * 4);
		const lumber = Math.ceil(
			(game.random() * game.random()) ** (1 / 2) * 35,
		);
		const tnt = Math.floor((game.random() * game.random()) ** (1 / 2) * 3);

		const alliedPlaceholderPlayer = getAlliedPlaceholderPlayer();
		const enemyPlaceholderPlayer = getEnemyPlaceholderPlayer();

		game.alliances.set(
			alliedPlaceholderPlayer,
			enemyPlaceholderPlayer,
			"enemy",
			true,
		);

		for (const owner of game.players) {
			if (owner.id < 0) continue;

			owner.ready = false;
			owner.resources.gold = gold;
			owner.resources.lumber = lumber;
			owner.resources.tnt = tnt;
			game.alliances.set(owner, alliedPlaceholderPlayer, "ally", true);
			game.alliances.set(owner, enemyPlaceholderPlayer, "enemy", true);

			const u = new Builder({
				...center(owner.color!.index),
				owner,
			});
			new PathingComponent(u);

			if (owner === game.localPlayer) {
				game.selectionSystem.select(u);
				game.graphics.panTo(u.position, 0);
			}
		}

		spawnCheckpoint(game);

		spawnBlocks(game);
		spawnThunders(game);

		this.timer = new Entity();
		new Timer(
			this.timer,
			derivedCallback(),
			30, // build time
			false,
			true,
			undefined,
			this.derivedCallback,
		);
		new TimerWindow(this.timer, "Time remaining: ");
		new MainLogicTimerHook(this.timer);
		game.add(this.timer);
	}

	private endRound(game: MazingContest) {
		if (!this.round) return;

		if (this.round.runnerStart)
			logLine(
				"endRound",
				game.time - this.round.runnerStart,
				game.entities
					.filter((e) => isRunner(e))
					.map(
						(e) =>
							e.get(IsDone)[0]!.time - this.round!.runnerStart!,
					),
			);

		this.round = undefined;
		game.entities.forEach((v) => isUnit(v) && v.kill());
	}

	update(delta: number, time: number): void {
		const game = currentMazingContest();

		if (this.round?.runnerStart && game.runnerTracker.done)
			this.endRound(game);

		if (!this.round && game.players.some((p) => p.id >= 0))
			this.startRound(time, game);
	}
}
