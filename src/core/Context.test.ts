import { Context } from "./Context";

it("with", () => {
	const manager = new Context<{ v: string } | undefined>({ v: "a" });

	expect(manager.current).toEqual({ v: "a" });

	manager.with({ v: "b" }, (context) => {
		expect(context).toEqual({ v: "b" });
		expect(manager.current).toEqual({ v: "b" });

		manager.with({ v: "c" }, (context) => {
			expect(context).toEqual({ v: "c" });
			expect(manager.current).toEqual({ v: "c" });
		});

		expect(manager.current).toEqual({ v: "b" });

		manager.with({ v: "d" }, (context) => {
			expect(context).toEqual({ v: "d" });
			expect(manager.current).toEqual({ v: "d" });
		});

		expect(manager.current).toEqual({ v: "b" });
	});

	expect(manager.current).toEqual({ v: "a" });
});

it("wrap", () => {
	const manager = new Context<{ v: number } | undefined>(undefined);

	const fn = (inc: number, mult: number) => (manager.current!.v + inc) * mult;

	const fn3 = manager.wrap({ v: 3 }, fn);
	const fn5 = manager.wrap({ v: 5 }, fn);
	const fn7 = manager.wrap({ v: 7 }, fn);

	const fn35 = manager.wrap({ v: 5 }, fn3);
	const fn57 = manager.wrap({ v: 7 }, fn5);

	expect(fn3(2, 11)).toEqual((3 + 2) * 11);
	expect(fn5(2, 11)).toEqual((5 + 2) * 11);
	expect(fn7(2, 11)).toEqual((7 + 2) * 11);

	expect(fn35(2, 11)).toEqual((3 + 2) * 11);
	expect(fn57(2, 11)).toEqual((5 + 2) * 11);
});

it("wrap memoizes", () => {
	const manager = new Context<{ v: number }>({ v: 5 });

	const fn1 = () => manager.current.v + 7;
	const fn2 = () => manager.current.v + 8;

	const obj1 = { v: 6 };
	const obj2 = { v: 6 };

	expect(manager.wrap(obj1, fn1)).toBe(manager.wrap(obj1, fn1));
	expect(manager.wrap(obj1, fn1)).not.toBe(manager.wrap(obj2, fn1));
	expect(manager.wrap(obj1, fn1)).not.toBe(manager.wrap(obj1, fn2));
});
