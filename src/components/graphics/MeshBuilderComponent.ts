import { DeprecatedComponent } from "../../core/Component";
import { DeprecatedComponentManager } from "../../core/DeprecatedComponentManager";
import { Entity } from "../../core/Entity";
import { Color } from "three";

export type Props = {
	shape: "square" | "circle";
	color?: string;
	colorFilter?: (color: Color) => Color;
	scale?: number;
	shadow?: string;
	opacity?: number;
};

export class MeshBuilderComponent extends DeprecatedComponent {
	readonly shape: "square" | "circle";
	readonly targetable: boolean;
	readonly color?: string;
	readonly colorFilter?: (color: Color) => Color;
	readonly scale?: number;
	readonly shadow?: string;
	readonly opacity: number;

	constructor(
		entity: Entity,
		{
			shape,
			targetable,
			color,
			colorFilter,
			scale = 1,
			shadow,
			opacity = 1,
		}: Props & {
			targetable: boolean;
		},
	) {
		super(entity);
		this.shape = shape;
		this.targetable = targetable;
		this.color = color;
		this.colorFilter = colorFilter;
		this.scale = scale;
		this.shadow = shadow;
		this.opacity = opacity;
	}
}

export const MeshBuilderComponentManager = new DeprecatedComponentManager<
	MeshBuilderComponent
>(MeshBuilderComponent);
