import { Component, ComponentConstructor } from "./Component.js";
import { Sprite } from "../sprites/Sprite.js";

export class ComponentManager<T extends Component> {
	private map = new WeakMap<Sprite, T>();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private component: ComponentConstructor<T>;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor(componentConstructor: ComponentConstructor<T>) {
		this.component = componentConstructor;
	}

	get(entity: Sprite): T | undefined {
		return this.map.get(entity);
	}

	set(entity: Sprite, component: T): void {
		const oldComponent = this.map.get(entity);
		oldComponent?.dispose();

		this.map.set(entity, component);
		entity.game.entityComponentUpdated(entity, this.component);
	}

	delete(entity: Sprite): void {
		const component = this.map.get(entity);
		component?.dispose();

		this.map.delete(entity);
		entity.game.entityComponentUpdated(entity, this.component);
	}

	has(entity: Sprite): boolean {
		return this.map.has(entity);
	}
}
