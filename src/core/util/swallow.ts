import type { RecursivePartial } from "./types";

/**
 * Swallow returns a recrusive empty object, allowing you to do
 * `swallow().a.b.c['c'].f().g` without error. This is used for server clients
 * that do not implement the DOM.
 * @param obj
 */
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
			get: (_: unknown, prop) => {
				const p = (prop as unknown) as keyof T;
				if (prop in memory) return memory[p];
				memory[p] =
					p === Symbol.toPrimitive
						? (((() => 1) as unknown) as T[keyof T])
						: swallow();
				return memory[p];
			},
			set: (_, prop, value) => {
				memory[(prop as unknown) as keyof T] = value;
				return true;
			},
			apply: () => swallow(),
		},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	) as any) as T;
};

export { swallow };
