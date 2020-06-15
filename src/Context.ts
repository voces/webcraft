const INITIAL = {};

export class Context<T> {
	private currentValue: T = INITIAL as T;

	with<A>(value: T, fn: () => A): A {
		const old = this.currentValue;
		this.currentValue = value;
		const ret = fn();
		this.currentValue = old;
		return ret;
	}

	// TODO: remove this
	set(value: T): void {
		this.currentValue = value;
	}

	get current(): T {
		if (this.currentValue === INITIAL) {
			throw new Error(
				"Attempting to get current value from context that has no value.",
			);
		}

		return this.currentValue;
	}
}
