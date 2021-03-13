export class PublicSetView<T> {
	private set: Set<T>;

	constructor(set: Set<T>) {
		this.set = set;
	}

	find(fn: (value: T) => boolean): T | undefined {
		for (const value of this.set) if (fn(value)) return value;
	}

	forEach(fn: (value: T) => void): void {
		for (const value of this.set) fn(value);
	}
}
