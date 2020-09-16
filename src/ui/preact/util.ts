export const classNames = (...args: (string | undefined)[]): string =>
	args.filter(Boolean).join(" ");

type Style = undefined | Record<string, string | number>;

export const styles = (...args: Style[]): Style => {
	const final: Style = {};
	for (const style of args)
		for (const rule in style) final[rule] = style[rule];

	return final;
};
