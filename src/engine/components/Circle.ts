import { Component } from "../../core/Component";
import { Entity } from "../../core/Entity";
import { SelectionCircle } from "../entities/widgets/sprites/SelectionCircle";
import { currentGame } from "../gameContext";
import { getXY } from "./Position";

type Props = {
	radius: number;
	color: string;
};

type InternalProps = Props & { x: number; y: number };

const hasCollisionRadius = (
	entity: Entity | (Entity & { collisionRadius: number }),
): entity is Entity & { collisionRadius: number } =>
	"collisionRadius" in entity;

export abstract class Circle extends Component<[InternalProps]> {
	circle!: SelectionCircle;

	constructor(entity: Entity, props: Partial<Props> = {}) {
		const xy = getXY(entity);
		super(entity, {
			radius:
				props.radius ??
				(hasCollisionRadius(entity)
					? entity.collisionRadius * 1.25
					: 1),
			color: props.color ?? "#00FF00",
			x: xy?.x ?? 0,
			y: xy?.y ?? 0,
		});
	}

	initialize({ radius, color, x, y }: InternalProps): void {
		this.circle = new SelectionCircle({
			radius,
			color,
			x,
			y,
		});
	}

	dispose(): void {
		currentGame().remove(this.circle);
		super.dispose();
	}
}
