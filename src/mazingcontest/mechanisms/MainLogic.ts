import { Entity } from "../../core/Entity";
import { logLine } from "../../core/logger";
import { Mechanism } from "../../core/Merchanism";
import { Timer } from "../../engine/components/Timer";
import { TimerWindow } from "../../engine/components/TimerWindow";
import type { Unit } from "../../engine/entities/widgets/sprites/Unit";
import { isUnit } from "../../engine/typeguards";
import { Block } from "../entities/Block";
import { Builder } from "../entities/Builder";
import { Checkpoint } from "../entities/Checkpoint";
import { Runner } from "../entities/Runner";
import { Thunder } from "../entities/Thunder";
import { isPathable } from "../helpers";
import type { MazingContest } from "../MazingContest";
import { currentMazingContest } from "../mazingContestContext";
import {
	getAlliedPlaceholderPlayer,
	getEnemyPlaceholderPlayer,
} from "../players/placeholder";
import type { Player } from "../players/Player";
import { terrain } from "../terrain";
import { isCheckpoint } from "../typeguards";

interface Obstruction {
	type: "thunder" | "block";
	x: number;
	y: number;
}

const spawnCheckpoint = (game: MazingContest) => {
	const x = terrain.width / 2 + Math.round(game.random.between(-9, 8)) + 0.5;
	const y = terrain.height / 2 + Math.round(game.random.between(-9, 8)) + 0.5;

	const entity = new Checkpoint({
		x,
		y,
		owner: getAlliedPlaceholderPlayer(),
	});

	const newPos = game.pathingMap.nearestSpiralPathing(x, y, entity);

	if (game.pathingMap.pathable(entity, x, y)) {
		entity.position.setXY(newPos.x, newPos.y);

		game.pathingMap.addEntity(entity);
	} else entity.kill({ removeImmediately: true });
};

const spawnUnits = (
	game: MazingContest,
	count: number,
	factory: (props: { x: number; y: number; owner: Player }) => Unit,
) => {
	while (count--) {
		const x = terrain.width / 2 + Math.round(game.random.between(-9, 8));
		const y = terrain.height / 2 + Math.round(game.random.between(-9, 8));

		const entity = factory({
			x,
			y,
			owner: getAlliedPlaceholderPlayer(),
		});

		const newPos = game.pathingMap.nearestSpiralPathing(x, y, entity);

		if (game.pathingMap.pathable(entity, newPos.x, newPos.y)) {
			entity.position.setXY(newPos.x, newPos.y);
			game.pathingMap.addEntity(entity);

			if (!isPathable()) entity.kill({ removeImmediately: true });
		} else entity.kill({ removeImmediately: true });
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

export class MainLogic extends Mechanism {
	phase: "idle" | "build" | "run" = "idle";
	round?: {
		buildStart: number;
		buildTime: number;
		runnerStart?: number;
		initial: Obstruction[];
		lumber: number;
		gold: number;
		tnt: number;
	};
	timer?: Entity;

	startRunners(): void {
		if (!this.timer || !this.round) return;

		const game = currentMazingContest();

		game.remove(this.timer);
		this.round.runnerStart = game.time;

		game.players.forEach((p) => {
			if (p.id < 0) return;
			const builder = p.sprites.find((s) => s instanceof Builder);
			if (builder) builder.kill();
		});

		const u = new Runner({
			x: terrain.width / 2,
			y: terrain.height / 2 - 10.5,
			owner: getEnemyPlaceholderPlayer(),
		});
		game.pathingMap.addEntity(u);

		let target = {
			x: terrain.width / 2,
			y: terrain.height / 2 + 10.5,
		};
		if (game.settings.checkpoints) {
			const checkpoint = game.entities.find(isCheckpoint)!;
			target = {
				x: checkpoint.position.x,
				y: checkpoint.position.y,
			};
		}
		u.walkTo(target);
	}

	private startRound(time: number, game: MazingContest) {
		this.round = {
			buildStart: time,
			buildTime: game.settings.buildTime,
			initial: [],
			gold: game.settings.thunderTowers
				? Math.floor((game.random() * game.random()) ** (1 / 2) * 4)
				: 0,
			lumber: Math.ceil((game.random() * game.random()) ** (1 / 2) * 35),
			tnt: Math.floor((game.random() * game.random()) ** (1 / 2) * 3),
		};

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
			owner.resources.gold = this.round.gold;
			owner.resources.lumber = this.round.lumber;
			owner.resources.tnt = this.round.tnt;
			game.alliances.set(owner, alliedPlaceholderPlayer, "ally", true);
			game.alliances.set(owner, enemyPlaceholderPlayer, "enemy", true);

			const u = new Builder({
				x: terrain.width / 2,
				y: terrain.height / 2,
				owner,
			});

			if (owner === game.localPlayer) {
				game.selectionSystem.select(u);
				game.graphics.panTo(u.position, 0);
			}
		}

		if (game.settings.checkpoints) spawnCheckpoint(game);

		spawnBlocks(game);
		spawnThunders(game);

		this.timer = new Entity();
		new Timer(this.timer, () => this.startRunners(), this.round.buildTime);
		new TimerWindow(this.timer, "Time remaining: ");
		game.add(this.timer);
	}

	private endRound(game: MazingContest) {
		if (!this.round) return;

		if (this.round.runnerStart)
			logLine("endRound", game.time - this.round.runnerStart);

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
