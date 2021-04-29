import { Component } from "../../core/Component";
import type { Mutable } from "../../engine/types";

export class IsDone extends Component<[time: number]> {
	static argMap = ["time"];
	readonly time!: number;

	initialize(time: number): void {
		const mutable: Mutable<IsDone> = this;
		mutable.time = time;
	}
}
