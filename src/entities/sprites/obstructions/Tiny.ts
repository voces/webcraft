import { Obstruction, ObstructionProps } from "./Obstruction";

export class Tiny extends Obstruction {
	static defaults = {
		...Obstruction.defaults,
		radius: 0.5,
		maxHealth: 40,
		buildHotkey: "t" as const,
	};

	constructor(props: ObstructionProps) {
		super({ ...Tiny.clonedDefaults, ...props });
	}
}
