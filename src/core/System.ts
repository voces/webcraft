import { Sprite } from "../sprites/Sprite.js";
import { ComponentConstructor } from "./Component.js";

type SystemEvents = {
	add: (entity: Sprite) => void;
	remove: (entity: Sprite) => void;
};

abstract class System<T extends Sprite = Sprite> {
	private set: Set<T> = new Set();
	protected dirty?: Set<T>;
	private _callbacks: Map<Sprite, { removeListener: () => void }> = new Map();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static components: ComponentConstructor<any>[] = [];

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	test(entity: Sprite | T): entity is T {
		return true;
	}

	private _add(entity: T): void {
		this.set.add(entity);
		this.dirty?.add(entity);
		const removeListener = () => this.remove(entity);
		this._callbacks.set(entity, {
			removeListener,
		});
		entity.addEventListener("remove", removeListener);
		this.onAddEntity?.(entity);
	}

	add(...entites: Sprite[]): void {
		for (const entity of entites)
			if (this.test(entity) && !this.set.has(entity)) this._add(entity);
	}

	private _remove(entity: Sprite): void {
		this.set.delete(entity as T);
		this.dirty?.delete(entity as T);
		this._callbacks.delete(entity);
		this.onRemoveEntity?.(entity);
	}

	remove(...entites: Sprite[]): void {
		for (const entity of entites)
			if (this.set.has(entity as T)) this._remove(entity);
	}

	/**
	 * If the passed entity satisifies `set`, then the entity is added to the
	 * system. Otherwise, it is removed.
	 */
	check(entity: Sprite): void {
		if (this.test(entity)) {
			if (!this.set.has(entity)) this._add(entity);
		} else if (this.set.has(entity as T)) this._remove(entity);
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
		/* do nothing */
	}

	[Symbol.iterator](): IterableIterator<T> {
		return (this.dirty ?? this.set)[Symbol.iterator]();
	}
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface System<T> {
	update?(entity: T, delta: number, time: number): void;
	render?(entity: T, delta: number, time: number): void;
	onAddEntity?(entity: T): void;
	onRemoveEntity?(entity: Sprite): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySystem = System<Sprite>;

export { System };
