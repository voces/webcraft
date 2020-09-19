import { Context } from "../Context";

const context = new Context({ replacing: false });

export const whileReplacingComponent = <T>(fn: () => T): T =>
	context.with(
		{
			...context.current,
			replacing: true,
		},
		fn,
	);

export const isReplacingComponent = (): boolean => context.current.replacing;
