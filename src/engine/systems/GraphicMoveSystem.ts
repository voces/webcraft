import type { Entity } from "../../core/Entity";
import { System } from "../../core/System";
import { ThreeObjectComponent } from "../components/graphics/ThreeObjectComponent";
import { Hover } from "../components/Hover";
import { MoveTarget } from "../components/MoveTarget";
import { Position } from "../components/Position";
import { Selected } from "../components/Selected";
import type { Widget } from "../entities/Widget";
import { SELECTION_CRICLE_ZOFFSET } from "../entities/widgets/SelectionCircle";
import { currentGame } from "../gameContext";

type EntityWithSpeed = Entity & { speed: number };

const hasSpeed = (
	entity: Entity | EntityWithSpeed,
): entity is EntityWithSpeed =>
	"speed" in entity && typeof entity.speed === "number";

/**
 * For rendered moving objects, will tween the Three Object and their circles.
 */
export class GraphicMoveSystem extends System {
	static components = [ThreeObjectComponent, Position, MoveTarget];
	readonly pure = true;

	test(entity: Entity | Widget): entity is Widget {
		return (
			ThreeObjectComponent.has(entity) &&
			Position.has(entity) &&
			MoveTarget.has(entity)
		);
	}

	render(entity: Widget, delta: number): void {
		const object = entity.model.object;
		const moveTarget = entity.get(MoveTarget)[0];
		const game = currentGame();

		if (moveTarget && hasSpeed(entity)) {
			moveTarget.renderProgress += entity.speed * delta;
			const { x, y } = moveTarget.path(moveTarget.renderProgress);
			object.position.x = x;
			object.position.y = y;
			object.position.z =
				object.position.z * 0.8 +
				((game.terrain?.groundHeight(x, y) ?? 0) +
					entity.position.zOffset) *
					0.2;
		} else {
			const position = entity.position;
			object.position.x = position.x;
			object.position.y = position.y;
			object.position.z =
				(game.terrain?.groundHeight(position.x, position.y) ?? 0) +
				entity.position.zOffset;
		}

		// TODO: we can probably generalize this with a Children component
		[Selected, Hover].forEach((Circle) => {
			const circle = entity.get(Circle)[0]?.circle;
			if (circle) {
				circle.model.object.position.copy(object.position);
				circle.model.object.position.z += SELECTION_CRICLE_ZOFFSET;
			}
		});
	}
}
