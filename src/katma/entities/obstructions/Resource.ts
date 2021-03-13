import type { ObstructionProps } from "./Obstruction";
import { Obstruction } from "./Obstruction";

export class Resource extends Obstruction {
	static readonly isResource = true;

	static defaults = {
		...Obstruction.defaults,
		maxHealth: 20,
		cost: { essence: 35 },
		buildHotkey: "e" as const,
		buildDescription: "Increases essence generation for the entire team.",
	};

	constructor(props: ObstructionProps) {
		super({ ...Resource.clonedDefaults, ...props });
	}
}
