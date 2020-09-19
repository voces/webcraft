import { Component } from "../../core/Component";
import { SelectionCircle } from "../../entities/SelectionCircle";
import { getXY } from "./Position";
import { Entity } from "../../core/Entity";
import { currentGame } from "../gameContext";

type Props = {
	radius: number;
	color: string;
};

type InternalProps = Props & { x: number; y: number };

const hasRadius = (
	entity: Entity | (Entity & { radius: number }),
): entity is Entity & { radius: number } => "radius" in entity;

export abstract class Circle extends Component<[InternalProps]> {
	circle!: SelectionCircle;

	constructor(entity: Entity, props: Partial<Props> = {}) {
		const xy = getXY(entity);
		super(entity, {
			radius:
				props.radius ?? (hasRadius(entity) ? entity.radius * 1.25 : 1),
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
