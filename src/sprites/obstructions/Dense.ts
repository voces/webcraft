import { Obstruction, ObstructionProps } from "./Obstruction.js";

export class Dense extends Obstruction {
	static defaults = {
		...Obstruction.defaults,
		maxHealth: 240,
		armor: 0.25,
		cost: { essence: 4 },
		buildHotkey: "g" as const,
		graphic: {
			...Obstruction.defaults.graphic,
			shadow: "inset 0 0 16px rgba(0,0,0,0.75)",
		},
	};

	constructor(props: ObstructionProps) {
		super({ ...Dense.clonedDefaults, ...props });
	}
}
