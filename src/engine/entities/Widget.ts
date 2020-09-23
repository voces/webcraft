import { Entity, EntityID } from "../../core/Entity";
import { ThreeObjectComponent } from "../components/graphics/ThreeObjectComponent";
import { Position } from "../components/Position";

export type WidgetProps = {
	id?: EntityID;
	x: number;
	y: number;
};

export class Widget extends Entity {
	static readonly isWidget = true;

	constructor({ id, x, y }: WidgetProps) {
		super(id);
		new Position(this, x, y);
	}

	get position(): Position {
		const pos = this.get(Position);
		if (pos.length !== 1)
			throw new Error(`Expected a Position, got ${pos.length}`);

		return pos[0]!;
	}

	get model(): ThreeObjectComponent {
		const mdl = this.get(ThreeObjectComponent);
		if (mdl.length !== 1)
			throw new Error(
				`Expected a ThreeObjectComponent, got ${mdl.length}`,
			);

		return mdl[0]!;
	}
}
