import { AnySystem, System } from "./System.js";
import { Mechanism } from "./Merchanism.js";
import { Sprite } from "../sprites/Sprite.js";
import { requestAnimationFrame } from "../util/globals.js";
import { ComponentConstructor } from "./Component.js";

class App {
	private systems: AnySystem[] = [];
	private mechanisms: Mechanism[] = [];
	private lastRender = 0;
	private requestedAnimationFrame?: number;
	private _time = 0;
	private componentUpdateMap = new Map<
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		ComponentConstructor<any>,
		AnySystem[]
	>();
	// TODO: make this private!
	lastUpdate = 0;

	constructor() {
		this.requestedAnimationFrame = requestAnimationFrame(() =>
			this.render(),
		);
	}

	addSystem(system: AnySystem): App {
		this.systems.push(system);

		for (const component of (system.constructor as typeof System)
			.components) {
			let arr = this.componentUpdateMap.get(component);

			if (!arr) {
				arr = [];
				this.componentUpdateMap.set(component, arr);
			}

			arr.push(system);
		}

		return this;
	}

	addMechanism(mechanism: Mechanism): App {
		this.mechanisms.push(mechanism);

		return this;
	}

	dispose(): void {
		for (const mechanism of this.mechanisms) mechanism.dispose();
		for (const system of this.systems) system.dispose();
	}

	add(...entities: Sprite[]): App {
		for (const system of this.systems) system.add(...entities);

		return this;
	}

	remove(...entities: Sprite[]): App {
		for (const system of this.systems) system.remove(...entities);

		return this;
	}

	/**
	 * Should be called when an entity's component is updated. This will trigger
	 * the checking of systems that care about the component.
	 */
	entityComponentUpdated(
		entity: Sprite,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		component: ComponentConstructor<any>,
	): void {
		const arr = this.componentUpdateMap.get(component);
		if (!arr) return;
		for (const system of arr) system.check(entity);
	}

	render(): void {
		this.requestedAnimationFrame = requestAnimationFrame(() =>
			this.render(),
		);

		const thisRender = Date.now() / 1000;
		const delta = thisRender - this.lastRender;

		for (const mechanism of this.mechanisms)
			mechanism.render(delta, thisRender);

		for (const system of this.systems) {
			system.preRender(delta, thisRender);

			if (system.render)
				for (const entity of system)
					system.render!(entity, delta, thisRender);

			system.postRender(delta, thisRender);
		}

		this.lastRender = thisRender;
	}

	/**
	 * The logical loop.
	 */
	update(e: { time: number }): void {
		this._time = e.time / 1000;
		const delta = this._time - this.lastUpdate;

		for (const mechanism of this.mechanisms)
			mechanism.update(delta, this._time);

		for (const system of this.systems) {
			system.preUpdate(delta, this._time);

			if (system.update)
				for (const entity of system)
					system.update!(entity, delta, this._time);

			system.postUpdate(delta, this._time);
		}

		this.lastUpdate = this._time;
	}

	get time(): number {
		return this._time;
	}
}

export { App };
