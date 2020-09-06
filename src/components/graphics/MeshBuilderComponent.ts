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
	shadows?: boolean;
};

export class MeshBuilderComponent extends DeprecatedComponent {
	readonly shape: "square" | "circle";
	readonly targetable: boolean;
	readonly color?: string;
	readonly colorFilter?: (color: Color) => Color;
	readonly scale?: number;
	readonly shadow?: string;
	readonly opacity: number;
	readonly shadows: boolean;

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
			shadows = true,
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
		this.shadows = shadows;
	}
}

export const MeshBuilderComponentManager = new DeprecatedComponentManager<
	MeshBuilderComponent
>(MeshBuilderComponent);
