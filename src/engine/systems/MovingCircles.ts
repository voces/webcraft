import { Entity } from "../../core/Entity";
import { System } from "../../core/System";
import { Hover } from "../components/Hover";
import { MoveTarget } from "../components/MoveTarget";
import { getXY, Position } from "../components/Position";
import { Selected } from "../components/Selected";

export class SelectedMovingCircles extends System {
	static components = [MoveTarget, Selected];

	test(entity: Entity): entity is Entity {
		return Selected.has(entity) && MoveTarget.has(entity);
	}

	update(entity: Entity): void {
		const circle = entity.get(Selected)[0]?.circle;
		if (!circle) return;

		const xy = getXY(entity);

		Position.setXY(circle, xy ? xy.x : 0, xy ? xy.y : 0);
	}
}

export class HoverMovingCircles extends System {
	static components = [MoveTarget, Hover];

	test(entity: Entity): entity is Entity {
		return Hover.has(entity) && MoveTarget.has(entity);
	}

	update(entity: Entity): void {
		const circle = entity.get(Hover)[0]?.circle;
		if (!circle) return;

		const xy = getXY(entity);

		Position.setXY(circle, xy ? xy.x : 0, xy ? xy.y : 0);
	}
}

export const circleSystems = [SelectedMovingCircles, HoverMovingCircles];
