import type { ObstructionProps } from "./Obstruction";
import { Obstruction } from "./Obstruction";

export class Stack extends Obstruction {
	static defaults = {
		...Obstruction.defaults,
		collisionRadius: 1,
		maxHealth: 15,
		buildTime: 2,
		requiresPathing: 0,
		cost: { essence: 15 },
		buildHotkey: "a" as const,
		buildDescription: "Can be built anywhere",
		facing: (7 / 4) * Math.PI,
		meshBuilder: {
			...Obstruction.defaults.meshBuilder,
			scale: Math.SQRT1_2,
		},
	};

	constructor(props: ObstructionProps) {
		super({ ...Stack.clonedDefaults, ...props });
	}
}
