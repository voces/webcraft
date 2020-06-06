import { Obstruction, ObstructionProps } from "./Obstruction.js";

export class Tiny extends Obstruction {
	static defaults = {
		...Obstruction.defaults,
		radius: 0.5,
		maxHealth: 40,
	};

	constructor(props: ObstructionProps) {
		super({ ...Tiny.clonedDefaults, ...props });
	}
}
