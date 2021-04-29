import { currentApp } from "./appContext";
import type { Entity } from "./Entity";
import { isReplacingComponent, whileReplacingComponent } from "./util/flags";

export class Component<
	InitializationParameters extends unknown[] = unknown[],
	E extends Entity = Entity
> {
	static has(entity: Entity): boolean {
		return entity.has(this);
	}

	static clear(entity: Entity): boolean {
		return entity.clear(this);
	}

	static argMap: string[] = [];

	readonly entity: E;
	readonly derived: boolean = false;

	constructor(entity: E, ...rest: InitializationParameters) {
		this.entity = entity;

		const constructor = <typeof Component>this.constructor;
		entity.add(constructor, this);

		if (this.initialize) this.initialize(...rest);

		currentApp().entityComponentUpdated(
			entity,
			<typeof Component>this.constructor,
		);
	}

	// This method is invoked by the constructor before notifying the App of a
	// change
	protected initialize?(...rest: InitializationParameters): void;

	dispose(): void {
		if (!isReplacingComponent())
			currentApp().entityComponentUpdated(
				this.entity,
				this.constructor as typeof Component,
			);
	}

	/**
	 * Disposes `this` and adds a new component of the same type to the entity.
	 * Skips informing the app the original component was removed and instead
	 * relies on the new component informing the app of the change.
	 */
	replace(
		...args: InitializationParameters
	): Component<InitializationParameters, E> {
		return whileReplacingComponent(() => {
			this.entity.clear(this);
			return new (this.constructor as new (
				entity: E,
				...args: InitializationParameters
			) => Component<InitializationParameters, E>)(this.entity, ...args);
		});
	}

	toJSON(): {
		type: string;
		[key: string]: unknown;
	} {
		const { entity, derived, ...props } = this;
		return { type: this.constructor.name, ...props };
	}

	static fromJSON(
		...args: ConstructorParameters<typeof Component>
	): Component {
		return new this(...args);
	}
}

export interface ComponentConstructor<T extends Component = Component> {
	new (
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		...args: any[]
	): T;
	fromJSON: typeof Component["fromJSON"];
	argMap: string[];
}
