import type { Color, Mesh } from "three";

import { Component } from "../../../core/Component";
import type { Mutable } from "../../types";

export type MeshBuilderComponentProps = {
	shape: "square" | "circle";
	color?: string;
	colorFilter?: (color: Color) => Color;
	scale?: number;
	shadow?: string;
	opacity?: number;
	shadows?: boolean;
	mutator?: (mesh: Mesh) => void;
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
	readonly mutator?: (mesh: Mesh) => void;

	initialize({
		shape,
		targetable,
		color,
		colorFilter,
		scale = 1,
		shadow,
		opacity = 1,
		shadows = true,
		mutator,
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
		mutable.mutator = mutator;
	}
}
