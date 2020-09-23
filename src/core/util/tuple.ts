const memory = new WeakMap();

// eslint-disable-next-line @typescript-eslint/ban-types
export const tuple = <T extends object[]>(...values: T): T => {
	if (values.length === 0)
		throw new Error("tuple expects at least one argument");

	let store = memory;

	for (let i = 0; i < values.length - 1; i++)
		if (store.has(values[i])) store = store.get(values[i]);
		else {
			const newStore = new WeakMap();
			store.set(values[i], newStore);
			store = newStore;
		}

	const lastValue = values[values.length - 1];
	const tuple = store.get(lastValue);
	if (tuple) return tuple;

	store.set(lastValue, values);
	return values;
};
