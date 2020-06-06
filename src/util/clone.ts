export const clone = <T>(obj: T): T => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const data: any = Array.isArray(obj) ? [] : {};
	for (const prop in obj) {
		data[prop] =
			typeof obj[prop] === "object" && obj[prop] !== null
				? clone(obj[prop])
				: obj[prop];
	}

	return data;
};
