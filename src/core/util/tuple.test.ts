import { tuple } from "./tuple";

it("works", () => {
	const obj1 = {};
	const obj2 = {};
	const obj3 = {};

	const first = tuple(obj1, obj2, obj3);
	expect(tuple(obj1, obj2, obj3)).toStrictEqual(first);

	const second = tuple(obj1, obj2);
	expect(first).not.toStrictEqual(second);
	expect(tuple(obj1, obj2)).toStrictEqual(second);
});

it("throws on empty", () => {
	expect(() => tuple()).toThrow("tuple expects at least one argument");
});
