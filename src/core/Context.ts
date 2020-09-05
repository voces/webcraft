export class Context<T> {
	private _current: T;

	constructor(context: T) {
		this._current = context;
	}

	get current(): T {
		return this._current;
	}

	/** This should not be used. Just here for initial development. Instead use
	 * Context#with.
	 */
	_setCurrent(context: T): T {
		this._current = context;
		return context;
	}

	with<A, B extends T>(context: B, fn: (context: B) => A): A {
		const old = this._current;
		this._current = context;
		const ret = fn(context);
		this._current = old;
		return ret;
	}

	wrap<Passed extends T, Args extends unknown[], Return extends unknown>(
		context: Passed,
		fn: (...args: Args) => Return,
	): (...args: Args) => Return {
		return (...args: Args) => this.with(context, () => fn(...args));
	}
}
