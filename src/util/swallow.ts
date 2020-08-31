import { RecursivePartial } from "../types";

/**
 * Swallow returns a recrusive empty object, allowing you to do
 * `swallow().a.b.c['c'].f().g` without error. This is used for server clients
 * that do not implement the DOM.
 * @param obj
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const swallow = <T>(obj: RecursivePartial<T> = {}): T => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const memory: T = obj as any;
	return (new Proxy(
		Object.assign(
			() => {
				/* do nothing */
			},
			{ valueOf: () => 0 },
		),
		{
			get: <P extends keyof T>(_: unknown, prop: P) => {
				if (prop in memory) return memory[prop];
				memory[prop] =
					prop === Symbol.toPrimitive
						? (((() => 1) as unknown) as T[P])
						: swallow<T[P]>();
				return memory[prop];
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
