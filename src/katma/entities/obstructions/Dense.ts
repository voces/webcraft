import { Color } from "three";

import type { ObstructionProps } from "./Obstruction";
import { Obstruction } from "./Obstruction";

const darkRed = new Color("#661919");

export class Dense extends Obstruction {
	static defaults = {
		...Obstruction.defaults,
		maxHealth: 240,
		armor: 0.25,
		cost: { essence: 4 },
		buildHotkey: "g" as const,
		meshBuilder: {
			...Obstruction.defaults.meshBuilder,
			colorFilter: (color: Color): Color => color.lerp(darkRed, 0.75),
		},
	};

	constructor(props: ObstructionProps) {
		super({ ...Dense.clonedDefaults, ...props });
	}
}
