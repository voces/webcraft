import { Component } from "../../core/Component";
import type { Entity } from "../../core/Entity";
import { currentGame } from "../gameContext";
import type { Mutable } from "../types";

export class Timer extends Component<
	[fn: () => void, timeout: number, periodic: boolean, oncePerUpdate: boolean]
> {
	readonly fn!: () => void;
	readonly timeout!: number;
	readonly periodic!: boolean;
	readonly oncePerUpdate!: boolean;
	next!: number;

	constructor(
		entity: Entity,
		fn: () => void,
		timeout: number,
		periodic = false,
		oncePerUpdate = true,
	) {
		super(entity, fn, timeout, periodic, oncePerUpdate);
	}

	initialize(
		fn: () => void,
		timeout: number,
		periodic: boolean,
		oncePerUpdate: boolean,
	): void {
		const mutable: Mutable<Timer> = this;
		mutable.fn = fn;
		mutable.timeout = timeout;
		mutable.periodic = periodic;
		mutable.oncePerUpdate = oncePerUpdate;
		this.next = currentGame().time + timeout;
	}
}
