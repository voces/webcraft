import {
	DeprecatedComponent,
	DeprecatedComponentConstructor,
} from "./Component";
import { Entity } from "./Entity";
import { hasAppProp } from "./util";

export class DeprecatedComponentManager<T extends DeprecatedComponent> {
	private map = new WeakMap<Entity, T>();
	private component: DeprecatedComponentConstructor<T>;

	constructor(componentConstructor: DeprecatedComponentConstructor<T>) {
		this.component = componentConstructor;
	}

	get(entity: Entity): T | undefined {
		return this.map.get(entity);
	}

	set(entity: Entity, component: T): void {
		const oldComponent = this.map.get(entity);
		oldComponent?.dispose();

		this.map.set(entity, component);

		if (hasAppProp(entity))
			entity.app.entityComponentUpdated(entity, this.component);
	}

	delete(entity: Entity): void {
		const component = this.map.get(entity);
		component?.dispose();

		this.map.delete(entity);

		if (hasAppProp(entity))
			entity.app.entityComponentUpdated(entity, this.component);
	}

	has(entity: Entity): boolean {
		return this.map.has(entity);
	}
}
