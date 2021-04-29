import type { Mesh } from "three/src/objects/Mesh";

import { PATHING_TYPES } from "../../engine/constants";
import type { ObstructionProps } from "./Obstruction";
import { Obstruction } from "./Obstruction";
import { registerEntity } from "./registry";

export class Checkpoint extends Obstruction {
	static defaults = {
		...Obstruction.defaults,
		collisionRadius: 0.5,
		blocksPathing: PATHING_TYPES.BUILDABLE,
		meshBuilder: {
			...Obstruction.defaults.meshBuilder,
			mutator: (mesh: Mesh): void => {
				mesh.scale.z = 0.25;
			},
		},
	};

	isCheckpoint = true;

	constructor(props: ObstructionProps) {
		super({ ...Checkpoint.clonedDefaults, ...props });
	}
}

registerEntity(Checkpoint);
