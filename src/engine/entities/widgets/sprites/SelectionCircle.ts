import { Mesh, MeshBasicMaterial, TorusBufferGeometry } from "three";

import { ThreeObjectComponent } from "../../../components/graphics/ThreeObjectComponent";
import { currentGame } from "../../../gameContext";
import { Widget } from "../../Widget";

export class SelectionCircle extends Widget {
	constructor({
		radius,
		color,
		x,
		y,
	}: {
		radius: number;
		color: string;
		x: number;
		y: number;
	}) {
		super({ id: "SELECTION_CIRCLE", x, y });
		const geometry = new TorusBufferGeometry(radius, radius * 0.05, 3, 24);
		const material = new MeshBasicMaterial({
			color,
		});

		const mesh = new Mesh(geometry, material);

		new ThreeObjectComponent(this, mesh);

		currentGame().add(this);
	}
}
