import { Component } from "../../core/Component";
import type { Entity } from "../../core/Entity";
import type { Game } from "../Game";
import { currentGame } from "../gameContext";
import type { Mutable } from "../types";

export class Timer extends Component<
	[
		fn: () => void,
		timeout: number,
		periodic: boolean,
		oncePerUpdate: boolean,
		next?: number,
		derivedIndex?: number,
	]
> {
	static argMap = [
		"timeout",
		"periodic",
		"oncePerUpdate",
		"next",
		"derivedIndex",
	];
	private static derivedCallbacks = new WeakMap<Game, (() => () => void)[]>();

	static registerDerviedCallback = (fn: () => () => void): number => {
		const game = currentGame();
		let derivedCallbacks = Timer.derivedCallbacks.get(game);
		if (!derivedCallbacks) {
			derivedCallbacks = [];
			Timer.derivedCallbacks.set(game, derivedCallbacks);
		}

		const existing = derivedCallbacks.indexOf(fn);
		if (existing >= 0) return existing;
		return derivedCallbacks.push(fn) - 1;
	};

	readonly fn!: () => void;
	readonly timeout!: number;
	readonly periodic!: boolean;
	readonly oncePerUpdate!: boolean;
	readonly derivedIndex?: number;
	next!: number;

	constructor(
		entity: Entity,
		fn: () => void,
		timeout: number,
		periodic = false,
		oncePerUpdate = true,
		next?: number,
		derivedIndex?: number,
	) {
		super(entity, fn, timeout, periodic, oncePerUpdate, next, derivedIndex);
	}

	initialize(
		fn: () => void,
		timeout: number,
		periodic: boolean,
		oncePerUpdate: boolean,
		next?: number,
		derivedIndex?: number,
	): void {
		const mutable: Mutable<Timer> = this;
		mutable.fn = fn;
		mutable.timeout = timeout;
		mutable.periodic = periodic;
		mutable.oncePerUpdate = oncePerUpdate;
		if (typeof derivedIndex === "number")
			mutable.derivedIndex = derivedIndex;
		this.next = next ?? currentGame().time + timeout;
	}

	static fromJSON(
		entity: Entity,
		timeout: number,
		periodic: boolean,
		oncePerUpdate: boolean,
		next?: number,
		derivedIndex?: number,
	): Timer {
		if (typeof derivedIndex !== "number")
			throw new Error("Unable to hydrate timer without derivedIndex");

		const game = currentGame();
		const derivedCallbacks = Timer.derivedCallbacks.get(game);
		const fn = derivedCallbacks?.[derivedIndex]();

		if (!fn)
			throw new Error(
				"Unable to hydrate timer with invalid derivedIndex",
			);

		return new Timer(
			entity,
			fn,
			timeout,
			periodic,
			oncePerUpdate,
			next,
			derivedIndex,
		);
	}
}
