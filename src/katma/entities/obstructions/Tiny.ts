import type { ObstructionProps } from "./Obstruction";
import { Obstruction } from "./Obstruction";

export class Tiny extends Obstruction {
	static defaults = {
		...Obstruction.defaults,
		collisionRadius: 0.5,
		maxHealth: 40,
		buildHotkey: "t" as const,
	};

	constructor(props: ObstructionProps) {
		super({ ...Tiny.clonedDefaults, ...props });
	}
}
