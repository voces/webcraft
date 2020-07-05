import { System } from "./System.js";
import { Mechanism } from "./Merchanism.js";
import { Entity } from "./types.js";

class App {
	private systems: System[] = [];
	private mechanisms: Mechanism[] = [];
	private lastRender = 0;
	private requestedAnimationFrame?: number;
	// TODO: make this private!
	lastUpdate = 0;

	addSystem(system: System) {
		this.systems.push(system);
	}

	addMechanism(mechanism: Mechanism) {
		this.mechanisms.push(mechanism);
	}

	dispose() {
		for (let i = 0; i < this.systems.length; i++) this.systems[i].dispose();

		for (let i = 0; i < this.mechanisms.length; i++)
			this.mechanisms[i].dispose();
	}

	add(...entities: Entity[]) {
		for (let n = 0; n < this.systems.length; n++)
			this.systems[n].add(...entities);

		return this;
	}

	remove(...entities: Entity[]) {
		for (let n = 0; n < this.systems.length; n++)
			this.systems[n].remove(...entities);

		return this;
	}

	render() {
		this.requestedAnimationFrame = requestAnimationFrame(this.render);

		const thisRender = Date.now() / 1000;
		const delta = thisRender - this.lastRender;

		for (let i = 0; i < this.mechanisms.length; i++)
			this.mechanisms[i].render(delta);

		for (let i = 0; i < this.systems.length; i++) {
			this.systems[i].preRender(delta);

			if (this.systems[i].render)
				for (let n = 0; n < this.systems[i].length; n++)
					this.systems[i].render!(this.systems[i][n], delta);

			this.systems[i].postRender(delta);
		}

		this.lastRender = thisRender;

		return this;
	}

	/**
	 * The logical loop.
	 */
	update(e: { time: number }) {
		const time = e.time / 1000;
		const delta = time - this.lastUpdate;

		for (let i = 0; i < this.mechanisms.length; i++)
			this.mechanisms[i].update(delta);

		for (let i = 0; i < this.systems.length; i++) {
			this.systems[i].preUpdate(delta);

			if (this.systems[i].update)
				for (let n = 0; n < this.systems[i].length; n++)
					this.systems[i].update!(this.systems[i][n], delta);

			this.systems[i].postUpdate(delta);
		}

		this.lastUpdate = time;
	}
}

export { App };
