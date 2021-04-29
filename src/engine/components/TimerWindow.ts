import { Component } from "../../core/Component";
import type { Mutable } from "../types";

export class TimerWindow extends Component<[title: string]> {
	static argMap = ["title"];
	readonly title!: string;

	initialize(title: string): void {
		const mutable: Mutable<TimerWindow> = this;
		mutable.title = title;
	}
}
