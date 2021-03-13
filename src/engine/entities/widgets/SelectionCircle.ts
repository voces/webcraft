import { Mesh, MeshBasicMaterial, TorusBufferGeometry } from "three";

import { ThreeObjectComponent } from "../../components/graphics/ThreeObjectComponent";
import { currentGame } from "../../gameContext";
import { Widget } from "../Widget";

export const SELECTION_CRICLE_ZOFFSET = 0.0625;

export class SelectionCircle extends Widget {
	static readonly isSelectionCircle = true;

	constructor({
		radius,
		color,
		x,
		y,
		zOffset = 0,
	}: {
		radius: number;
		color: string;
		x: number;
		y: number;
		zOffset?: number;
	}) {
		super({
			id: "SELECTION_CIRCLE",
			x,
			y,
			zOffset: zOffset + SELECTION_CRICLE_ZOFFSET,
		});
		const geometry = new TorusBufferGeometry(radius, radius * 0.05, 3, 24);
		const material = new MeshBasicMaterial({
			color,
		});

		const mesh = new Mesh(geometry, material);

		new ThreeObjectComponent(this, mesh);

		currentGame().add(this);
	}
}
