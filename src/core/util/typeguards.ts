export const isRecord = (
	value: unknown,
): value is Record<string | number | symbol, unknown> =>
	!!value && typeof value === "object";

export const isError = (value: unknown): value is Error =>
	isRecord(value) && "message" in value && typeof value.message === "string";
