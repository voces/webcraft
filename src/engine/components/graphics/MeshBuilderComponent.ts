import { Component } from "../../../core/Component";
import { Color } from "three";
import { Mutable } from "../../types";

export type Props = {
	shape: "square" | "circle";
	color?: string;
	colorFilter?: (color: Color) => Color;
	scale?: number;
	shadow?: string;
	opacity?: number;
	shadows?: boolean;
};

type InnerProps = Props & { targetable: boolean };

export class MeshBuilderComponent extends Component<[InnerProps]> {
	readonly shape!: "square" | "circle";
	readonly targetable!: boolean;
	readonly color?: string;
	readonly colorFilter?: (color: Color) => Color;
	readonly scale?: number;
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
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const that: Mutable<MeshBuilderComponent> = this;
		that.shape = shape;
		that.targetable = targetable;
		that.color = color;
		that.colorFilter = colorFilter;
		that.scale = scale;
		that.shadow = shadow;
		that.opacity = opacity;
		that.shadows = shadows;
	}
}
