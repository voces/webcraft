export class Context<T> {
	private _context: T;

	constructor(context: T) {
		this._context = context;
	}

	get context(): T {
		return this._context;
	}

	/** This should not be used. Just here for initial development. Instead use
	 * Context#with.
	 */
	_setContext(context: T): T {
		this._context = context;
		return context;
	}

	with<A>(context: T, fn: (context: T) => A): A {
		const old = this._context;
		this._context = context;
		const ret = fn(context);
		this._context = old;
		return ret;
	}
}
