import { Component } from "../../core/Component";
import type { Entity } from "../../core/Entity";
import type { Mutable } from "../types";

export class TimerWindow extends Component<[title: string]> {
	readonly title!: string;

	constructor(entity: Entity, title: string) {
		super(entity, title);
	}

	initialize(title: string): void {
		const mutable: Mutable<TimerWindow> = this;
		mutable.title = title;
	}
}
