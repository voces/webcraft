import { Entity } from "../../core/Entity";
import { System } from "../../core/System";
import { ThreeObjectComponent } from "../components/graphics/ThreeObjectComponent";
import { Hover } from "../components/Hover";
import { Position } from "../components/Position";
import { Selected } from "../components/Selected";
import { Widget } from "../entities/Widget";
import { currentGame } from "../gameContext";

/**
 * For rendered objects, if the position is explicitly set, we should also
 * update the rendered position.
 */
export class GraphicTrackPosition extends System {
	static components = [ThreeObjectComponent, Position];

	test(entity: Entity | Widget): entity is Widget {
		return ThreeObjectComponent.has(entity) && Position.has(entity);
	}

	private updatePosition(entity: Widget) {
		const position = entity.position;
		const object = entity.model.object;
		const game = currentGame();

		object.position.x = position.x;
		object.position.y = position.y;
		object.position.z =
			game.terrain!.groundHeight(position.x, position.y) +
			entity.position.zOffset;

		// TODO: we can probably generalize this with a Children component
		[Selected, Hover].forEach((Circle) => {
			const circle = entity.get(Circle)[0]?.circle;
			if (circle) circle.position.setXY(position.x, position.y);
		});
	}

	onAddEntity(entity: Widget): void {
		this.updatePosition(entity);
	}

	modified(entity: Widget): void {
		this.updatePosition(entity);
	}
}
