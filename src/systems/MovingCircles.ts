import { System } from "../core/System";
import { Selected } from "../components/Selected";
import { Entity } from "../core/Entity";
import { Position, getEntityXY } from "../components/Position";
import { MoveTargetManager, MoveTarget } from "../components/MoveTarget";
import { Hover } from "../components/Hover";

export class SelectedMovingCircles extends System {
	static components = [MoveTarget, Selected];

	test(entity: Entity): entity is Entity {
		return (
			Selected.has(entity) &&
			// Movement is legacy
			MoveTargetManager.has(entity)
		);
	}

	update(entity: Entity): void {
		const circle = Selected.get(entity)?.circle;
		if (!circle) return;

		const xy = getEntityXY(entity);

		Position.clear(circle);
		new Position(circle, xy ? xy.x : 0, xy ? xy.y : 0);
	}
}

export class HoverMovingCircles extends System {
	static components = [MoveTarget, Hover];

	test(entity: Entity): entity is Entity {
		return (
			Hover.has(entity) &&
			// Movement is legacy
			MoveTargetManager.has(entity)
		);
	}

	update(entity: Entity): void {
		const circle = Hover.get(entity)?.circle;
		if (!circle) return;

		const xy = getEntityXY(entity);

		Position.clear(circle);
		new Position(circle, xy ? xy.x : 0, xy ? xy.y : 0);
	}
}

export const circleSystems = [SelectedMovingCircles, HoverMovingCircles];
