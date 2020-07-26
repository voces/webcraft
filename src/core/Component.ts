import { Sprite } from "../sprites/Sprite";

export abstract class Component<
	T extends Sprite = Sprite,
	A extends unknown[] = []
> {
	readonly entity: T;

	constructor(entity: T) {
		this.entity = entity;
	}

	dispose(): void {
		/* do nothing */
	}
}

export class EComponent<
	InitializationParameters extends unknown[] = []
> extends Component<Sprite, InitializationParameters> {
	protected static map = new WeakMap<Sprite, EComponent>();
	static get(entity: Sprite): EComponent | undefined {
		return this.map.get(entity);
	}
	static has(entity: Sprite): boolean {
		return this.map.has(entity);
	}
	static clear(entity: Sprite): boolean {
		const cleared = this.map.delete(entity);
		if (cleared)
			entity.game.entityComponentUpdated(
				entity,
				<ComponentConstructor<EComponent>>this,
			);
		return cleared;
	}

	constructor(entity: Sprite, ...rest: InitializationParameters) {
		super(entity);

		const constructor = <typeof EComponent>this.constructor;
		if (constructor.has(entity))
			throw new Error(
				`Adding duplicate component ${constructor.name} to Entity ${entity.constructor.name}`,
			);

		constructor.map.set(entity, this);

		if (this.initialize) this.initialize(...rest);
		this.entity.game.entityComponentUpdated(
			entity,
			<ComponentConstructor<EComponent>>this.constructor,
		);
	}

	// This method is invoked by the constructor before notifying the App of a
	// change
	initialize?: (...rest: InitializationParameters) => void;
}

export type ComponentConstructor<T extends Component> = new (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	...args: any[]
) => T;
