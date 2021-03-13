import { Component } from "../../core/Component";
import type { Entity } from "../../core/Entity";
import { System } from "../../core/System";
import type { Runner } from "../entities/Runner";
import { isRunner } from "../typeguards";

export class RunnerTracker extends System<Runner> {
	readonly pure = true;
	static readonly components = [Component];

	test(entity: Entity): entity is Runner {
		return isRunner(entity) && entity.has(Component);
	}

	get done(): boolean {
		return Array.from(this).every((r) => r.idle);
	}
}
