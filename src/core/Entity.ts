import { Component, ComponentConstructor } from "./Component";

export class Entity {
	id: unknown;
	private map = new Map<ComponentConstructor<Component>, Component[]>();

	constructor(id?: unknown) {
		if (id && !this.id) this.id = id;
	}

	/**
	 * If `klass` is not passed, returns all components on `this`. Otherwise,
	 * returns the components of type `C` on `this`.
	 */
	get<K extends ComponentConstructor<Component<unknown[]>>>(
		klass?: K,
	): ReadonlyArray<InstanceType<K> | undefined> {
		// Casting to C[] here means we're casting to Component<any>[], which is
		// fine
		if (!klass)
			return Array.from(this.map.values()).flat() as InstanceType<K>[];

		return (this.map.get(klass) as InstanceType<K>[]) ?? [];
	}

	/**
	 * Adds `component` to `this`.
	 */
	add<C extends Component, K extends ComponentConstructor<C>>(
		klass: K,
		component: C,
	): void {
		const components = this.map.get(klass) ?? [];
		components.push(component);
		this.map.set(klass, components);
	}

	has<K extends ComponentConstructor<Component>>(klass: K): boolean {
		return (this.map.get(klass)?.length ?? 0) > 0;
	}

	/**
	 * If no argument is passed, all components are cleared. If a constructor is
	 * passed, all components of that type are cleared. If a specific component
	 * is passed, that component is cleared.
	 */
	clear<
		T extends
			| Component<unknown[]>
			| ComponentConstructor<Component<unknown[]>>
	>(arg?: T): boolean {
		let cleared = false;

		// Clear all components
		if (!arg) {
			const oldMap = this.map;
			this.map = new Map();
			for (const [, components] of oldMap)
				for (const component of components) {
					cleared = true;
					component.dispose();
				}
			return cleared;
		}

		// Clearing all components of type
		if (typeof arg === "function") {
			const klass = arg as ComponentConstructor<Component<unknown[]>>;
			const components = this.map.get(klass);
			if (!components) return false;
			this.map.set(klass, []);

			for (const component of components) {
				cleared = true;
				component.dispose();
			}

			return cleared;
		}

		// Clear a specific component
		const component = arg as Component<unknown[]>;
		const klass = arg.constructor as ComponentConstructor<
			Component<unknown[]>
		>;
		const components = this.map.get(klass);
		if (!components) return false;

		const index = components.indexOf(component);
		if (index >= 0) {
			cleared = true;
			components.splice(index, 1);
			component.dispose();
		}
		return cleared;
	}
}
