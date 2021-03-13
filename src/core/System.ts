import type { App } from "./App";
import type { ComponentConstructor } from "./Component";
import type { Entity } from "./Entity";

abstract class System<T extends Entity = Entity> {
	static readonly isSystem = true;
	private set: Set<T> = new Set();

	static readonly components: ReadonlyArray<ComponentConstructor> = [];

	/**
	 * A system is pure if the result of its test function is only dependent on
	 * the presence of components or is otherwise static for the entity (e.g.,
	 * the entity's class or readonly properties).
	 */
	abstract readonly pure: boolean;

	abstract test(entity: Entity | T): entity is T;

	private _add(entity: T): void {
		this.set.add(entity);
		this.onAddEntity?.(entity);
	}

	add(...entites: Entity[]): void {
		for (const entity of entites)
			if (this.test(entity) && !this.set.has(entity)) this._add(entity);
	}

	private _remove(entity: Entity): void {
		this.set.delete(entity as T);
		this.onRemoveEntity?.(entity);
	}

	remove(...entites: Entity[]): void {
		for (const entity of entites)
			if (this.set.has(entity as T)) this._remove(entity);
	}

	/**
	 * If the passed entity satisifies `test`, then the entity is added to the
	 * system. Otherwise, it is removed.
	 */
	check(entity: Entity): void {
		if (this.test(entity))
			if (!this.set.has(entity)) this._add(entity);
			else this.modified?.(entity);
		else if (this.set.has(entity as T)) this._remove(entity);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	preUpdate(delta: number, time: number): void {
		/* do nothing */
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	postUpdate(delta: number, time: number): void {
		/* do nothing */
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	preRender(delta: number, time: number): void {
		/* do nothing */
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	postRender(delta: number, time: number): void {
		/* do nothing */
	}

	dispose(): void {
		for (const entity of this.set) this._remove(entity);
	}

	[Symbol.iterator](): IterableIterator<T> {
		return this.set[Symbol.iterator]();
	}

	addToApp(app: App): this {
		app.addSystem(this);
		return this;
	}
}

interface System<T> {
	update?(entity: T, delta: number, time: number): void;
	render?(entity: T, delta: number, time: number): void;
	onAddEntity?(entity: T): void;
	onRemoveEntity?(entity: Entity): void;
	modified?(entity: Entity): void;
}

export { System };
