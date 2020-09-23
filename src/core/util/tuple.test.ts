import { tuple } from "./tuple";

it("works", () => {
	const obj1 = { id: 1 };
	const obj2 = { id: 2 };
	const obj3 = { id: 3 };

	const first = tuple(obj1, obj2, obj3);
	expect(tuple(obj1, obj2, obj3)).toBe(first);

	const second = tuple(obj1, obj2);
	expect(first).not.toBe(second);
	expect(tuple(obj1, obj2)).toBe(second);
});

it("enforces order", () => {
	const obj1 = { id: 1 };
	const obj2 = { id: 2 };

	const first = tuple(obj1, obj2);
	expect(tuple(obj1, obj2)).toBe(first);

	const second = tuple(obj2, obj1);
	expect(first).not.toBe(second);
	expect(tuple(obj2, obj1)).toBe(second);
});

it("allows mixed length", () => {
	const obj1 = { id: 1 };
	const obj2 = { id: 2 };
	const obj3 = { id: 3 };

	const a1 = tuple(obj1, obj2, obj3);
	const a2 = tuple(obj1, obj2, obj3);
	const b1 = tuple(obj1, obj2);
	const c1 = tuple(obj1);
	const a3 = tuple(obj1, obj2, obj3);
	const b2 = tuple(obj1, obj2);
	const c2 = tuple(obj1);

	expect(a1).toBe(a2);
	expect(a1).toBe(a3);
	expect(b1).toBe(b2);
	expect(c1).toBe(c2);
});

it("throws on empty", () => {
	expect(() => tuple()).toThrow("tuple expects at least one argument");
});
