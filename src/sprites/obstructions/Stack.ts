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
	};

	constructor(props: ObstructionProps) {
		super({ ...Stack.clonedDefaults, ...props });

		if (this.html?.htmlElement)
			this.html.htmlElement.style.transform =
				"rotate(45deg) scale(0.7071067811865475)";
	}
}
