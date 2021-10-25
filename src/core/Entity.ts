import { currentApp } from "./appContext";
import type { Component, ComponentConstructor } from "./Component";
import { isComponentConstructor } from "./Component";

export type EntityID = string | number;

export class Entity {
	static readonly isEntity = true;

	id: EntityID;

	private map = new Map<ComponentConstructor, Component[]>();

	constructor(id?: EntityID | { id: EntityID }) {
		if (id && typeof id === "object") id = id.id;
		this.id = id ?? currentApp().entityId++;
	}

	/**
	 * If `klass` is not passed, returns all components on `this`. Otherwise,
	 * returns the components of type `C` on `this`.
	 */
	get<K extends ComponentConstructor>(
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
	add<K extends ComponentConstructor, C extends InstanceType<K>>(
		klass: K,
		component: C,
	): void {
		const components = this.map.get(klass) ?? [];
		components.push(component);
		this.map.set(klass, components);
	}

	has<K extends ComponentConstructor>(klass: K): boolean {
		return (this.map.get(klass)?.length ?? 0) > 0;
	}

	/**
	 * If no argument is passed, all components are cleared. If a constructor is
	 * passed, all components of that type are cleared. If a specific component
	 * is passed, that component is cleared.
	 */
	clear<T extends Component | ComponentConstructor>(arg?: T): boolean {
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
		if (isComponentConstructor(arg)) {
			const components = this.map.get(arg);
			if (!components) return false;
			this.map.set(arg, []);

			for (const component of components) {
				cleared = true;
				component.dispose();
			}

			return cleared;
		}

		// Clear a specific component
		const klass = arg.constructor as typeof Component;
		const components = this.map.get(klass);
		if (!components) return false;

		const index = components.indexOf(arg);
		if (index >= 0) {
			cleared = true;
			components.splice(index, 1);
			arg.dispose();
		}
		return cleared;
	}

	get components(): Component[] {
		return Array.from(this.map.values()).flat();
	}

	toJSON(): {
		id: EntityID;
		components: ReturnType<Component["toJSON"]>[];
		[key: string]: unknown;
	} {
		return {
			id: this.id,
			components: Array.from(this.map.values()).flatMap((v) =>
				v.filter((c) => !c.derived).map((c) => c.toJSON()),
			),
		};
	}

	static fromJSON({
		components,
		...rest
	}: ReturnType<Entity["toJSON"]>): Entity {
		if ("clonedDefaults" in this)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			rest = { ...(this as any).clonedDefaults, ...rest };

		const entity = new this(rest);

		const app = currentApp();

		for (const { type, ...componentProps } of components) {
			const constructor = app.componentsMap[type];
			if (!constructor) {
				console.warn(`Unable to hydrate unknown component ${type}`);
				continue;
			}
			const args =
				constructor.argMap.length > 0
					? constructor.argMap.map((k) => componentProps[k])
					: [componentProps];
			constructor.fromJSON(entity, ...args);
		}

		return entity;
	}
}
