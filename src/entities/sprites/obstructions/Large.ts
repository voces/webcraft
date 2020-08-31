import { Obstruction, ObstructionProps } from "./Obstruction";

export class Large extends Obstruction {
	static defaults = {
		...Obstruction.defaults,
		radius: 1.5,
		maxHealth: 160,
		buildTime: 2,
		cost: { essence: 6 },
		buildHotkey: "w" as const,
	};

	constructor(props: ObstructionProps) {
		super({ ...Large.clonedDefaults, ...props });
	}
}
