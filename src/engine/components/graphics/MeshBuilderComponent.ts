import { Component } from "../../../core/Component";
import { Color } from "three";
import { Mutable } from "../../types";

export type MeshBuilderComponentProps = {
	shape: "square" | "circle";
	color?: string;
	colorFilter?: (color: Color) => Color;
	scale?: number;
	shadow?: string;
	opacity?: number;
	shadows?: boolean;
};

type InnerProps = MeshBuilderComponentProps & { targetable: boolean };

export class MeshBuilderComponent extends Component<[InnerProps]> {
	readonly shape!: "square" | "circle";
	readonly targetable!: boolean;
	readonly color?: string;
	readonly colorFilter?: (color: Color) => Color;
	readonly scale!: number;
	readonly shadow?: string;
	readonly opacity!: number;
	readonly shadows!: boolean;

	initialize({
		shape,
		targetable,
		color,
		colorFilter,
		scale = 1,
		shadow,
		opacity = 1,
		shadows = true,
	}: InnerProps): void {
		const mutable: Mutable<MeshBuilderComponent> = this;
		mutable.shape = shape;
		mutable.targetable = targetable;
		mutable.color = color;
		mutable.colorFilter = colorFilter;
		mutable.scale = scale;
		mutable.shadow = shadow;
		mutable.opacity = opacity;
		mutable.shadows = shadows;
	}
}
