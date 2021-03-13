import { withApp } from "./appContext";
import type { Component, ComponentConstructor } from "./Component";
import type { Entity } from "./Entity";
import type { Mechanism } from "./Merchanism";
import { PublicSetView } from "./PublicSetView";
import type { System } from "./System";
import { requestAnimationFrame } from "./util/globals";

export class App {
	protected _entities = new Set<Entity>();
	entities = new PublicSetView(this._entities);
	protected impureSystems: System[] = [];
	private allSystems: System[] = [];
	protected mechanisms: Mechanism[] = [];
	private lastRender = 0;
	private requestedAnimationFrame?: number;
	private _time = 0;
	private componentUpdateMap = new Map<ComponentConstructor, System[]>();
	private components: typeof Component[] = [];
	// TODO: make this private!
	lastUpdate = 0;
	entityId = 0;

	constructor() {
		this.requestedAnimationFrame = requestAnimationFrame(() =>
			this.render(),
		);
	}

	addSystem(system: System): App {
		this.allSystems.push(system);
		if (!system.pure) this.impureSystems.push(system);

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
		let index = this.allSystems.indexOf(system);
		if (index >= 0) this.allSystems.splice(index, 1);

		index = this.impureSystems.indexOf(system);
		if (index >= 0) this.impureSystems.splice(index, 1);

		system.dispose();

		return this;
	}

	addMechanism(mechanism: Mechanism): App {
		this.mechanisms.push(mechanism);

		return this;
	}

	dispose(): void {
		for (const mechanism of this.mechanisms) mechanism.dispose();
		for (const system of this.allSystems) system.dispose();
	}

	add(entity: Entity): boolean {
		if (this._entities.has(entity)) return false;

		this._entities.add(entity);

		for (const system of this.impureSystems) system.add(entity);

		return true;
	}

	// Also update Game#remove if updating this
	remove(entity: Entity): boolean {
		if (!this._entities.has(entity)) return false;

		for (const system of this.allSystems) system.remove(entity);

		entity.clear();
		this._entities.delete(entity);

		return true;
	}

	/**
	 * Should be called when an entity's component is updated. This will trigger
	 * the checking of systems that care about the component.
	 */
	entityComponentUpdated(
		entity: Entity,
		component: ComponentConstructor,
	): void {
		const systems = this.componentUpdateMap.get(component);
		if (!systems) return;
		for (const system of systems) system.check(entity);
	}

	protected _render(): void {
		this.requestedAnimationFrame = requestAnimationFrame(() =>
			this.render(),
		);

		const thisRender = Date.now() / 1000;
		const delta = thisRender - this.lastRender;

		for (const mechanism of this.mechanisms)
			mechanism.render(delta, thisRender);

		for (const system of this.allSystems) {
			system.preRender(delta, thisRender);

			if (system.render)
				for (const entity of system)
					system.render(entity, delta, thisRender);

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

		for (const system of this.allSystems) {
			system.preUpdate(delta, this._time);

			if (system.update)
				for (const entity of system)
					system.update(entity, delta, this._time);

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
