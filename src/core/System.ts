import { Sprite } from "../sprites/Sprite";

type SystemEvents = {
	add: (entity: Sprite) => void;
	remove: (entity: Sprite) => void;
};

class System<T extends Sprite> {
	private set: Set<T> = new Set();

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	test(entity: Sprite | T): entity is T {
		return true;
	}

	add(...entites: Sprite[]): void {
		for (const entity of entites)
			if (this.test(entity) && !this.set.has(entity)) {
				this.set.add(entity);
				this.onAddEntity?.(entity);
			}
	}

	remove(...entites: Sprite[]): void {
		for (const entity of entites)
			if (this.test(entity) && this.set.has(entity)) {
				this.set.delete(entity);
				this.onRemoveEntity?.(entity);
			}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	preUpdate(delta: number): void {
		/* do nothing */
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	postUpdate(delta: number): void {
		/* do nothing */
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	preRender(delta: number): void {
		/* do nothing */
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	postRender(delta: number): void {
		/* do nothing */
	}

	dispose(): void {
		/* do nothing */
	}

	[Symbol.iterator](): IterableIterator<T> {
		return this.set[Symbol.iterator]();
	}
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface System<T> {
	update?(entity: T, delta: number): void;
	render?(entity: T, delta: number): void;
	onAddEntity?(entity: T): void;
	onRemoveEntity?(entity: T): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySystem = System<Sprite>;

export { System };
