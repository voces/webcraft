import type { Entity } from "../../core/Entity";
import { Circle } from "./Circle";

type Props = {
	radius: number;
	color: string;
};

export class Selected extends Circle {
	constructor(entity: Entity, props: Partial<Props> = {}) {
		if (!props.color) props.color = "#00FF00";
		super(entity, props);
	}
}
