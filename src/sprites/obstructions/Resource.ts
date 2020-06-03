import { Obstruction, ObstructionProps } from "./Obstruction.js";

export class Resource extends Obstruction {
	static defaults = {
		...Obstruction.defaults,
		maxHealth: 20,
		cost: { essence: 35 },
	};

	constructor(props: ObstructionProps) {
		super({ ...Resource.defaults, ...props });
	}
}
