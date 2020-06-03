import { Obstruction, ObstructionProps } from "./Obstruction.js";

export class Large extends Obstruction {
	static defaults = {
		...Obstruction.defaults,
		radius: 1.5,
		maxHealth: 160,
		buildTime: 2,
		cost: { essence: 6 },
	};

	constructor(props: ObstructionProps) {
		super({ ...Large.defaults, ...props });
	}
}
