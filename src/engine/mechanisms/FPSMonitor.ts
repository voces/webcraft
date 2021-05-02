import { Mechanism } from "../../core/Mechanism";

export class FPSMonitor extends Mechanism {
	private renders: number[] = [];

	get fps(): number {
		return this.renders.length / 5;
	}

	render(_: number, time: number): void {
		this.renders.push(time);
		const fiveSecondsAgo = time - 5;
		while (this.renders.length && this.renders[0] < fiveSecondsAgo)
			this.renders.shift();
	}
}
