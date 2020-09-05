import { Entity } from "./Entity";
import { hasAppProp } from "./util";
import { App } from "./App";

export abstract class DeprecatedComponent<T extends Entity = Entity> {
	readonly entity: T;

	constructor(entity: T) {
		this.entity = entity;
	}

	dispose(): void {
		/* do nothing */
	}
}

export type DeprecatedComponentConstructor<
	T extends DeprecatedComponent
> = new (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	...args: any[]
) => T;

export abstract class Component<
	InitializationParameters extends unknown[] = []
> extends DeprecatedComponent<Entity> {
	static isComponentClass = (
		klass: typeof DeprecatedComponent | typeof Component,
	): klass is typeof Component => klass.prototype instanceof Component;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected static map = new WeakMap<Entity, Component<any>>();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static get(entity: Entity): Component<any> | undefined {
		return this.map.get(entity);
	}

	static has(entity: Entity): boolean {
		return this.map.has(entity);
	}

	static clear(entity: Entity): boolean {
		const cleared = this.map.delete(entity);

		if (cleared) {
			const app = App.current;
			if (app)
				app.entityComponentUpdated(
					entity,
					(this as unknown) as DeprecatedComponentConstructor<
						Component
					>,
				);
		}

		return cleared;
	}

	constructor(entity: Entity, ...rest: InitializationParameters) {
		super(entity);

		const constructor = <typeof Component>this.constructor;
		if (constructor.has(entity))
			throw new Error(
				`Adding duplicate component ${constructor.name} to Entity ${entity.constructor.name}`,
			);

		constructor.map.set(entity, this);

		if (this.initialize) this.initialize(...rest);
		if (hasAppProp(this.entity))
			this.entity.app.entityComponentUpdated(
				entity,
				<DeprecatedComponentConstructor<Component>>this.constructor,
			);
	}

	// This method is invoked by the constructor before notifying the App of a
	// change
	protected initialize?(...rest: InitializationParameters): void;
}

export type ComponentConstructor<T extends Component> = new (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	...args: any[]
) => T;
