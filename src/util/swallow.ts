/**
 * Swallow returns a recrusive empty object, allowing you to do
 * `swallow().a.b.c['c'].f().g` without error. This is used for server clients
 * that do not implement the DOM.
 * @param obj
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const swallow = <T>(obj?: T): T => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const memory: T = {} as any;
	return (new Proxy(
		Object.assign(
			() => {
				/* do nothing */
			},
			{ valueOf: () => 0 },
		),
		{
			get: (_, prop: keyof T) => {
				if (prop in memory) return memory[prop];
				if (prop === Symbol.toPrimitive) return () => 1;
				return swallow();
			},
			set: (_, prop: keyof T, value) => {
				memory[prop] = value;
				return true;
			},
			apply: () => swallow(),
		},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	) as any) as T;
};

export { swallow };
