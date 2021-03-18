import { Component } from "../../core/Component";
import type { UnitProps } from "../../engine/entities/widgets/sprites/Unit";
import { Unit } from "../../engine/entities/widgets/sprites/Unit";

export class Runner extends Unit {
	static defaults = {
		...Unit.defaults,
		collisionRadius: 0.5,
		speed: 4,
	};

	isRunner = true;

	constructor(props: UnitProps) {
		super({ ...Runner.clonedDefaults, ...props });
		// TODO: Pure systems should be able to detect componentless entities
		new Component(this);
	}
}
