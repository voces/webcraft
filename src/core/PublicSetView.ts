export class PublicSetView<T> {
	private set: Set<T>;

	constructor(set: Set<T>) {
		this.set = set;
	}

	find<S extends T>(fn: (value: T) => value is S): S | undefined;
	find(fn: (value: T) => boolean): T | undefined;
	find(fn: (value: T) => boolean): T | undefined {
		for (const value of this.set) if (fn(value)) return value;
	}

	filter<S extends T>(fn: (value: T) => value is S): S[];
	filter(fn: (value: T) => boolean): T[];
	filter(fn: (value: T) => boolean): T[] {
		const values = [];
		for (const value of this.set) if (fn(value)) values.push(value);
		return values;
	}

	map<K>(fn: (value: T) => K): K[] {
		const arr = [];
		for (const value of this.set) arr.push(fn(value));
		return arr;
	}

	forEach(fn: (value: T) => void): void {
		for (const value of this.set) fn(value);
	}

	[Symbol.iterator](): IterableIterator<T> {
		return this.set[Symbol.iterator]();
	}
}
