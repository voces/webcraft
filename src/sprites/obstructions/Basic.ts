import { Obstruction, ObstructionProps } from "./Obstruction.js";

export class Basic extends Obstruction {
	static defaults = {
		...Obstruction.defaults,
		maxHealth: 120,
	};

	constructor(props: ObstructionProps) {
		super({ ...Basic.clonedDefaults, ...props });
	}
}
