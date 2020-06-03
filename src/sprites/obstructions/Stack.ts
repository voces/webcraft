import { Obstruction, ObstructionProps } from "./Obstruction.js";

export class Stack extends Obstruction {
	static defaults = {
		radius: 1,
		maxHealth: 15,
		buildTime: 2,
		requiresPathing: 0,
		cost: { essence: 15 },
	};

	constructor(props: ObstructionProps) {
		super({ ...Stack.defaults, ...props });

		this.elem.style.transform = "rotate(45deg) scale(0.7071067811865475)";
	}
}
