import type { ObstructionProps } from "./Obstruction";
import { Obstruction } from "./Obstruction";

export class Basic extends Obstruction {
	static defaults = {
		...Obstruction.defaults,
		maxHealth: 120,
		buildHotkey: "f" as const,
	};

	constructor(props: ObstructionProps) {
		super({ ...Basic.clonedDefaults, ...props });
	}
}
