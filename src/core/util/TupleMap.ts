import { tuple } from "./tuple";

// eslint-disable-next-line @typescript-eslint/ban-types
export class WeakTupleMap<K extends object, V> extends WeakMap<K[], V> {
	sort?: (a: K, b: K) => -1 | 0 | 1;

	constructor(sort?: (a: K, b: K) => -1 | 0 | 1) {
		super();
		this.sort = sort;
	}

	getKey(key: readonly K[]): K[] {
		return tuple(...(this.sort ? [...key].sort(this.sort) : key));
	}

	set(key: readonly K[], value: V): this {
		return super.set(this.getKey(key), value);
	}

	has(key: readonly K[]): boolean {
		return super.has(this.getKey(key));
	}

	get(key: readonly K[]): V | undefined {
		return super.get(this.getKey(key));
	}

	delete(key: K[]): boolean {
		return super.delete(this.getKey(key));
	}
}

// eslint-disable-next-line @typescript-eslint/ban-types
export class TupleMap<K extends object, V> extends Map<K[], V> {
	sort?: (a: K, b: K) => -1 | 0 | 1;

	constructor(sort?: (a: K, b: K) => -1 | 0 | 1) {
		super();
		this.sort = sort;
	}

	getKey(key: readonly K[]): K[] {
		return tuple(...(this.sort ? [...key].sort(this.sort) : key));
	}

	set(key: readonly K[], value: V): this {
		return super.set(this.getKey(key), value);
	}

	has(key: readonly K[]): boolean {
		return super.has(this.getKey(key));
	}

	get(key: readonly K[]): V | undefined {
		return super.get(this.getKey(key));
	}

	delete(key: K[]): boolean {
		return super.delete(this.getKey(key));
	}
}
