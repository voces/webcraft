import type { ObstructionProps } from "./Obstruction";
import { Obstruction } from "./Obstruction";

export class Block extends Obstruction {
	static defaults = {
		...Obstruction.defaults,
		buildHotkey: "b" as const,
		cost: { lumber: 1 },
	};

	constructor(props: ObstructionProps) {
		super({ ...Block.clonedDefaults, ...props });
	}
}
