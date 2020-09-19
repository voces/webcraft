import { System } from "./System";
import { Mechanism } from "./Merchanism";
import { requestAnimationFrame } from "./util/globals";
import { ComponentConstructor, Component } from "./Component";
import { Entity } from "./Entity";
import { withApp } from "./appContext";

export class App {
	protected entities: Entity[] = [];
	protected systems: System[] = [];
	protected mechanisms: Mechanism[] = [];
	private lastRender = 0;
	private requestedAnimationFrame?: number;
	private _time = 0;
	private componentUpdateMap = new Map<ComponentConstructor, System[]>();
	private components: typeof Component[] = [];
	// TODO: make this private!
	lastUpdate = 0;

	constructor() {
		this.requestedAnimationFrame = requestAnimationFrame(() =>
			this.render(),
		);
	}

	addSystem(system: System): App {
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

	removeSystem(system: System): App {
		const index = this.systems.indexOf(system);
		if (index >= 0) this.systems.splice(index, 1);

		system.dispose();

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

	add(...entities: Entity[]): App {
		for (const system of this.systems) system.add(...entities);

		return this;
	}

	// Also update Game#remove if updating this
	remove(...entities: Entity[]): App {
		for (const system of this.systems) system.remove(...entities);

		for (const entity of entities) entity.clear();

		return this;
	}

	/**
	 * Should be called when an entity's component is updated. This will trigger
	 * the checking of systems that care about the component.
	 */
	entityComponentUpdated(
		entity: Entity,
		component: ComponentConstructor,
	): void {
		const arr = this.componentUpdateMap.get(component);
		if (!arr) return;
		for (const system of arr) system.check(entity);
	}

	protected _render(): void {
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

	render(): void {
		withApp(this, () => this._render());
	}

	protected _update(e: { time: number }): void {
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

	/**
	 * The logical loop.
	 */
	update(e: { time: number }): void {
		withApp(this, () => this._update(e));
	}

	get time(): number {
		return this._time;
	}
}
