import { Obstruction, ObstructionProps } from "./Obstruction.js";

export class Stack extends Obstruction {
	static defaults = {
		...Obstruction.defaults,
		radius: 1,
		maxHealth: 15,
		buildTime: 2,
		requiresPathing: 0,
		cost: { essence: 15 },
		buildHotkey: "a" as const,
		buildDescription: "Can be built anywhere",
		facing: 315,
		graphic: {
			...Obstruction.defaults.graphic,
			scale: Math.SQRT1_2,
		},
	};

	constructor(props: ObstructionProps) {
		super({ ...Stack.clonedDefaults, ...props });
	}
}
