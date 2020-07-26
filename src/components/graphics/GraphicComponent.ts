import { Sprite } from "../../sprites/Sprite.js";
import { Component } from "../../core/Component.js";
import { ComponentManager } from "../../core/ComponentManager.js";
import { EntityElement } from "../../systems/HTMLGraphics.js";

export class GraphicComponent extends Component {
	readonly shape: "square" | "circle";
	readonly targetable: boolean;
	readonly color?: string;
	readonly texture?: string;
	readonly scale?: number;
	readonly shadow?: string;
	entityElement?: EntityElement;

	constructor(
		entity: Sprite,
		{
			shape,
			targetable,
			color,
			texture,
			scale = 1,
			shadow,
		}: {
			shape: "square" | "circle";
			targetable: boolean;
			color?: string;
			texture?: string;
			scale?: number;
			shadow?: string;
		},
	) {
		super(entity);
		this.shape = shape;
		this.targetable = targetable;
		this.color = color;
		this.texture = texture;
		this.scale = scale;
		this.shadow = shadow;
	}
}

export const GraphicComponentManager = new ComponentManager<GraphicComponent>(
	GraphicComponent,
);
