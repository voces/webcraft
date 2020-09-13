import { currentApp } from "./appContext";
import { Entity } from "./Entity";

export class Component<
	InitializationParameters extends unknown[] = [],
	E extends Entity = Entity
> {
	static has(entity: Entity): boolean {
		return entity.has(this);
	}

	static clear(entity: Entity): boolean {
		return entity.clear(this);
	}

	readonly entity: E;

	constructor(entity: E, ...rest: InitializationParameters) {
		this.entity = entity;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const constructor = <ComponentConstructor<any>>this.constructor;
		entity.add(constructor, this);

		if (this.initialize) this.initialize(...rest);

		currentApp().entityComponentUpdated(
			entity,
			<ComponentConstructor<Component>>this.constructor,
		);
	}

	// This method is invoked by the constructor before notifying the App of a
	// change
	protected initialize?(...rest: InitializationParameters): void;

	dispose(): void {
		currentApp().entityComponentUpdated(
			this.entity,
			this.constructor as ComponentConstructor<Component>,
		);
	}
}

export type ComponentConstructor<T extends Component> = new (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	...args: any[]
) => T;
