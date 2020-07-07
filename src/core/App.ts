import { AnySystem } from "./System.js";
import { Mechanism } from "./Merchanism.js";
import { Sprite } from "../sprites/Sprite.js";

class App {
	private systems: AnySystem[] = [];
	private mechanisms: Mechanism[] = [];
	private lastRender = 0;
	private requestedAnimationFrame?: number;
	// TODO: make this private!
	lastUpdate = 0;

	addSystem(system: AnySystem): App {
		this.systems.push(system);

		return this;
	}

	addMechanism(mechanism: Mechanism): App {
		this.mechanisms.push(mechanism);

		return this;
	}

	dispose(): void {
		for (let i = 0; i < this.systems.length; i++) this.systems[i].dispose();

		for (let i = 0; i < this.mechanisms.length; i++)
			this.mechanisms[i].dispose();
	}

	add(...entities: Sprite[]): App {
		for (let n = 0; n < this.systems.length; n++)
			this.systems[n].add(...entities);

		return this;
	}

	remove(...entities: Sprite[]): App {
		for (let n = 0; n < this.systems.length; n++)
			this.systems[n].remove(...entities);

		return this;
	}

	render(): void {
		this.requestedAnimationFrame = requestAnimationFrame(this.render);

		const thisRender = Date.now() / 1000;
		const delta = thisRender - this.lastRender;

		for (let i = 0; i < this.mechanisms.length; i++)
			this.mechanisms[i].render(delta);

		for (let i = 0; i < this.systems.length; i++) {
			this.systems[i].preRender(delta);

			if (this.systems[i].render)
				for (const entity of this.systems[i])
					this.systems[i].render!(entity, delta);

			this.systems[i].postRender(delta);
		}

		this.lastRender = thisRender;
	}

	/**
	 * The logical loop.
	 */
	update(e: { time: number }): void {
		const time = e.time / 1000;
		const delta = time - this.lastUpdate;

		for (let i = 0; i < this.mechanisms.length; i++)
			this.mechanisms[i].update(delta);

		for (let i = 0; i < this.systems.length; i++) {
			this.systems[i].preUpdate(delta);

			if (this.systems[i].update)
				for (const entity of this.systems[i])
					this.systems[i].update!(entity, delta);

			this.systems[i].postUpdate(delta);
		}

		this.lastUpdate = time;
	}
}

export { App };
