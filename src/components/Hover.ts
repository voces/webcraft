import { Entity } from "../core/Entity";
import { Circle } from "./Circle";

type Props = {
	radius: number;
	color: string;
};

export class Hover extends Circle {
	constructor(entity: Entity, props: Partial<Props> = {}) {
		if (!props.color) props.color = "#FFFF00";
		super(entity, props);
	}
}
