import type { ObstructionProps } from "./Obstruction";
import { Obstruction } from "./Obstruction";
import { registerEntity } from "./registry";
import { Thunder } from "./Thunder";

export class Block extends Obstruction {
	static defaults = {
		...Obstruction.defaults,
		buildHotkey: "b" as const,
		cost: { lumber: 1 },
		upgradesTo: [Thunder],
	};

	constructor(props: ObstructionProps) {
		super({ ...Block.clonedDefaults, ...props });
	}
}

registerEntity(Block);
