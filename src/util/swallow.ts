
/**
 * Swallow returns a recrusive empty object, allowing you to do
 * `swallow().a.b.c['c'].f().g` without error. This is used for server clients
 * that do not implement the DOM.
 * @param obj
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const swallow = <T>( obj?: T ): T =>
	( new Proxy(
		Object.assign(
			() => { /* do nothing */ },
			{ valueOf: () => 0 },
		), {
			get: ( _, prop ) => {

				if ( prop === Symbol.toPrimitive ) return () => 0;
				return swallow();

			},
			apply: () => swallow(),
		},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	) ) as any as T;

export default swallow;
