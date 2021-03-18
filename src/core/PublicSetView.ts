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

	forEach(fn: (value: T) => void): void {
		for (const value of this.set) fn(value);
	}
}
