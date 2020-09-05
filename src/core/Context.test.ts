import { Context } from "./Context";

it("with", () => {
	const manager = new Context<undefined | string>("a");

	expect(manager.current).toEqual("a");

	manager.with("b", (context) => {
		expect(context).toEqual("b");
		expect(manager.current).toEqual("b");

		manager.with("c", (context) => {
			expect(context).toEqual("c");
			expect(manager.current).toEqual("c");
		});

		expect(manager.current).toEqual("b");

		manager.with("d", (context) => {
			expect(context).toEqual("d");
			expect(manager.current).toEqual("d");
		});

		expect(manager.current).toEqual("b");
	});

	expect(manager.current).toEqual("a");
});

it("wrap", () => {
	const manager = new Context<undefined | number>(undefined);

	const fn = (inc: number, mult: number) => (manager.current! + inc) * mult;

	const fn3 = manager.wrap(3, fn);
	const fn5 = manager.wrap(5, fn);
	const fn7 = manager.wrap(7, fn);

	const fn35 = manager.wrap(5, fn3);
	const fn57 = manager.wrap(7, fn5);

	expect(fn3(2, 11)).toEqual((3 + 2) * 11);
	expect(fn5(2, 11)).toEqual((5 + 2) * 11);
	expect(fn7(2, 11)).toEqual((7 + 2) * 11);

	expect(fn35(2, 11)).toEqual((3 + 2) * 11);
	expect(fn57(2, 11)).toEqual((5 + 2) * 11);
});
