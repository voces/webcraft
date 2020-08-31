import { Context } from "./Context";

it("works", () => {
	const manager = new Context<undefined | string>("a");

	expect(manager.context).toEqual("a");

	manager.with("b", (context) => {
		expect(context).toEqual("b");
		expect(manager.context).toEqual("b");

		manager.with("c", (context) => {
			expect(context).toEqual("c");
			expect(manager.context).toEqual("c");
		});

		expect(manager.context).toEqual("b");

		manager.with("d", (context) => {
			expect(context).toEqual("d");
			expect(manager.context).toEqual("d");
		});

		expect(manager.context).toEqual("b");
	});

	expect(manager.context).toEqual("a");
});
