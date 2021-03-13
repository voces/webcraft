import { Color } from "three";

import type { ObstructionProps } from "./Obstruction";
import { Obstruction } from "./Obstruction";

const black = new Color("#000");

export class Thunder extends Obstruction {
	static defaults = {
		...Obstruction.defaults,
		buildHotkey: "n" as const,
		cost: { gold: 1, lumber: 1 },
		meshBuilder: {
			...Obstruction.defaults.meshBuilder,
			colorFilter: (color: Color): Color => color.lerp(black, 0.75),
		},
	};

	readonly isThunder = true;

	constructor(props: ObstructionProps) {
		super({ ...Thunder.clonedDefaults, ...props });
	}
}
