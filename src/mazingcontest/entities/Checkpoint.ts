import type { Mesh } from "three/src/objects/Mesh";

import type { ObstructionProps } from "./Obstruction";
import { Obstruction } from "./Obstruction";

export class Checkpoint extends Obstruction {
	static defaults = {
		...Obstruction.defaults,
		collisionRadius: 0.5,
		meshBuilder: {
			...Obstruction.defaults.meshBuilder,
			mutator: (mesh: Mesh): void => {
				mesh.scale.z = 0.25;
			},
		},
	};

	constructor(props: ObstructionProps) {
		super({ ...Checkpoint.clonedDefaults, ...props });
	}
}
