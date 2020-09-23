import { TupleMap, WeakTupleMap } from "./TupleMap";

it("WeakTupleMap works", () => {
	const map = new WeakTupleMap<{ id: number }, number>();

	const obj1 = { id: 1 };
	const obj2 = { id: 2 };
	const obj3 = { id: 3 };

	map.set([obj1, obj2, obj3], 1);
	map.set([obj1, obj3, obj2], 2);
	map.set([obj1, obj2], 3);
	map.set([obj1, obj1], 4);
	map.set([obj1, obj3, obj2], 5);

	expect(map.get([obj1, obj2, obj3])).toEqual(1);
	expect(map.get([obj1, obj2])).toEqual(3);
	expect(map.get([obj1, obj1])).toEqual(4);
	expect(map.get([obj1, obj3, obj2])).toEqual(5);

	map.delete([obj1, obj2]);

	expect(map.get([obj1, obj2])).toEqual(undefined);
});

it("TupleMap works", () => {
	const map = new TupleMap<{ id: number }, number>();

	const obj1 = { id: 1 };
	const obj2 = { id: 2 };
	const obj3 = { id: 3 };

	map.set([obj1, obj2, obj3], 1);
	map.set([obj1, obj3, obj2], 2);
	map.set([obj1, obj2], 3);
	map.set([obj1, obj1], 4);
	map.set([obj1, obj3, obj2], 5);

	expect(map.get([obj1, obj2, obj3])).toEqual(1);
	expect(map.get([obj1, obj2])).toEqual(3);
	expect(map.get([obj1, obj1])).toEqual(4);
	expect(map.get([obj1, obj3, obj2])).toEqual(5);
	expect(map.size).toEqual(4);
});
